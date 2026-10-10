import { spawn } from "node:child_process";
import path from "node:path";
import type { IsolatedRunner } from "@/backend/verification/isolatedRunner";

/**
 * TEST-ONLY runner: executes the harness with the local `node` binary and NO isolation.
 * Only used with trusted, hand-written fixtures in this test suite — never wired into the app.
 */
export function createTrustedLocalRunner(): IsolatedRunner & { calls: number } {
  const harness = path.resolve(__dirname, "../../verifier/sqli-harness.mjs");
  const runner = {
    name: "trusted-local (tests only)",
    calls: 0,
    availability: async () => ({ ok: true as const }),
    runHarness: (stdin: string) =>
      new Promise<{ stdout: string; timedOut: boolean; exitCode: number | null }>((resolve) => {
        runner.calls++;
        const child = spawn(process.execPath, ["--no-warnings", harness], { env: { NODE_ENV: "test" } });
        let stdout = "";
        child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
        const timer = setTimeout(() => child.kill("SIGKILL"), 10_000);
        child.on("close", (code) => {
          clearTimeout(timer);
          resolve({ stdout, timedOut: code === null, exitCode: code });
        });
        child.stdin.end(stdin);
      }),
  };
  return runner;
}
