import { afterEach, describe, expect, it, vi } from "vitest";
import { readServerEnv } from "@/backend/config/serverEnv";
import { createDockerRunner, createRunnerFromEnv, dockerRunArgs } from "@/backend/verification/isolatedRunner";

// Docker itself is not exercised here (not installed in CI/dev); these tests pin the
// isolation flags and the environment handed to the docker CLI.
afterEach(() => vi.unstubAllEnvs());

describe("docker isolated runner", () => {
  it("runs with no network, dropped capabilities, read-only fs and resource limits", () => {
    const args = dockerRunArgs("node:24-alpine", "/app/verifier", "hmb-verify-x", 15).join(" ");
    for (const flag of [
      "--network none", "--read-only", "--cap-drop ALL", "--security-opt no-new-privileges",
      "--memory 128m", "--pids-limit 64", "--pull never", "--user 65534:65534", "/app/verifier:/harness:ro",
      "timeout -s KILL 15",
    ]) {
      expect(args).toContain(flag);
    }
    expect(args).not.toMatch(/\s-e\s|--env/);
  });

  it("never forwards app secrets to the docker CLI", async () => {
    vi.stubEnv("HF_TOKEN", "hf_secret");
    const exec = vi.fn().mockResolvedValue({ stdout: "", code: 0, killed: false });
    const runner = createDockerRunner(readServerEnv({ VERIFIER_RUNTIME: "docker" }), exec);
    await runner.runHarness("{}", new AbortController().signal);
    const options = exec.mock.calls[0]?.[2];
    expect(JSON.stringify(options?.env)).not.toContain("hf_secret");
  });

  it("reports unavailability when the image is missing", async () => {
    const exec = vi.fn().mockResolvedValue({ stdout: "", code: 1, killed: false });
    const runner = createDockerRunner(readServerEnv({ VERIFIER_RUNTIME: "docker" }), exec);
    expect(await runner.availability()).toMatchObject({ ok: false });
  });

  it("is disabled unless explicitly configured", async () => {
    expect(await createRunnerFromEnv(readServerEnv({})).availability()).toMatchObject({ ok: false });
  });
});
