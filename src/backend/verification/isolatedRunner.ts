import "server-only";
import { execFile, type ExecFileException } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { ServerEnv } from "@/backend/config/serverEnv";

export type RunnerAvailability = { ok: true } | { ok: false; reason: string };

export interface RunnerOutput {
  stdout: string;
  timedOut: boolean;
  exitCode: number | null;
}

/** Executes the fixture harness on untrusted code in an isolated environment. */
export interface IsolatedRunner {
  readonly name: string;
  availability(): Promise<RunnerAvailability>;
  runHarness(stdin: string, signal: AbortSignal): Promise<RunnerOutput>;
}

type ExecFn = (
  file: string,
  args: string[],
  options: { timeout: number; maxBuffer: number; env: NodeJS.ProcessEnv; signal?: AbortSignal },
  stdin?: string
) => Promise<{ stdout: string; code: number | null; killed: boolean }>;

const MAX_OUTPUT_BYTES = 256 * 1024;

const defaultExec: ExecFn = (file, args, options, stdin) =>
  new Promise((resolve) => {
    const execOptions = {
      encoding: "utf8" as const,
      timeout: options.timeout,
      maxBuffer: options.maxBuffer,
      env: options.env,
      killSignal: "SIGKILL" as const,
      ...(options.signal ? { signal: options.signal } : {}),
    };
    const child = execFile(file, args, execOptions, (error: ExecFileException | null, stdout: string) => {
      const code = error && typeof error.code === "number" ? error.code : error ? null : 0;
      resolve({ stdout: String(stdout ?? ""), code, killed: Boolean(error?.killed) });
    });
    child.stdin?.on("error", () => undefined);
    child.stdin?.end(stdin ?? "");
  });

/** The docker CLI gets only what it needs to reach the daemon — never app secrets. */
function dockerCliEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { NODE_ENV: process.env.NODE_ENV };
  for (const key of ["PATH", "HOME", "DOCKER_HOST", "DOCKER_CONTEXT", "DOCKER_CONFIG"]) {
    const value = process.env[key];
    if (value) env[key] = value;
  }
  return env;
}

export function dockerRunArgs(image: string, harnessDir: string, name: string, timeoutSec: number): string[] {
  return [
    "run", "--rm", "-i", "--name", name,
    "--pull", "never",
    "--network", "none",
    "--memory", "128m", "--memory-swap", "128m",
    "--cpus", "0.5", "--pids-limit", "64",
    "--read-only", "--tmpfs", "/tmp:rw,noexec,nosuid,size=4m",
    "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
    "--user", "65534:65534",
    "-v", `${harnessDir}:/harness:ro`,
    "-w", "/tmp",
    image,
    "timeout", "-s", "KILL", String(timeoutSec),
    "node", "--no-warnings", "/harness/sqli-harness.mjs",
  ];
}

export function createDockerRunner(env: ServerEnv, exec: ExecFn = defaultExec): IsolatedRunner {
  const harnessDir = path.resolve(process.cwd(), "verifier");
  let cached: { at: number; value: RunnerAvailability } | null = null;

  return {
    name: `docker (${env.VERIFIER_IMAGE}, no network)`,
    async availability() {
      if (cached && Date.now() - cached.at < 60_000) return cached.value;
      const probe = await exec("docker", ["image", "inspect", env.VERIFIER_IMAGE], {
        timeout: 5_000, maxBuffer: MAX_OUTPUT_BYTES, env: dockerCliEnv(),
      });
      const value: RunnerAvailability =
        probe.code === 0
          ? { ok: true }
          : { ok: false, reason: `Docker or image ${env.VERIFIER_IMAGE} unavailable (pull it first; runs use --pull never).` };
      cached = { at: Date.now(), value };
      return value;
    },
    async runHarness(stdin, signal) {
      const name = `hmb-verify-${randomUUID().slice(0, 12)}`;
      const timeoutSec = Math.ceil(env.VERIFIER_TIMEOUT_MS / 1000);
      const result = await exec(
        "docker",
        dockerRunArgs(env.VERIFIER_IMAGE, harnessDir, name, timeoutSec),
        { timeout: env.VERIFIER_TIMEOUT_MS + 5_000, maxBuffer: MAX_OUTPUT_BYTES, env: dockerCliEnv(), signal },
        stdin
      );
      if (result.killed || signal.aborted) {
        // Killing the CLI does not stop the container; remove it explicitly.
        await exec("docker", ["rm", "-f", name], { timeout: 5_000, maxBuffer: 4096, env: dockerCliEnv() });
      }
      return { stdout: result.stdout, timedOut: result.killed || result.code === 137, exitCode: result.code };
    },
  };
}

export function createUnavailableRunner(reason: string): IsolatedRunner {
  return {
    name: "none",
    availability: async () => ({ ok: false, reason }),
    runHarness: async () => {
      throw new Error(reason);
    },
  };
}

export function createRunnerFromEnv(env: ServerEnv): IsolatedRunner {
  if (env.VERIFIER_RUNTIME === "docker") return createDockerRunner(env);
  return createUnavailableRunner(
    "No isolated runner configured (set VERIFIER_RUNTIME=docker). Patches are never executed in the app process."
  );
}
