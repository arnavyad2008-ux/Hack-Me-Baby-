import "server-only";
import { readServerEnv, type ServerEnv } from "@/backend/config/serverEnv";
import { createRunnerFromEnv, type IsolatedRunner } from "@/backend/verification/isolatedRunner";
import { createHuggingFaceProvider } from "./huggingFaceService";
import type { LlmProvider } from "./llmProvider";

interface AuditRuntime {
  env: ServerEnv;
  runner: IsolatedRunner;
  getProvider: () => LlmProvider | null;
}

let cached: AuditRuntime | null = null;

/** Process-wide dependencies built from server-only configuration. */
export function getAuditRuntime(): AuditRuntime {
  if (cached) return cached;
  const env = readServerEnv();
  const runtime: AuditRuntime = {
    env,
    runner: createRunnerFromEnv(env),
    getProvider: () => createHuggingFaceProvider(env),
  };
  cached = runtime;
  return runtime;
}

const MAX_CONCURRENT_LIVE_RUNS = 3;
let activeLiveRuns = 0;

/** Returns a release function, or null when the server is at capacity. */
export function acquireLiveSlot(): (() => void) | null {
  if (activeLiveRuns >= MAX_CONCURRENT_LIVE_RUNS) return null;
  activeLiveRuns++;
  let released = false;
  return () => {
    if (!released) {
      released = true;
      activeLiveRuns--;
    }
  };
}
