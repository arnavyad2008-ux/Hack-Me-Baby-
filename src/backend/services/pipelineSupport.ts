import "server-only";
import type { RunError, StreamEventInput } from "@/shared/contracts/events";
import type { BlueResult, RedResult } from "@/shared/contracts/findings";
import type { SupportedLanguage } from "@/shared/contracts/limits";
import { deriveOutcome } from "@/shared/contracts/verification";
import type { IsolatedRunner } from "@/backend/verification/isolatedRunner";
import { verifyPatch } from "@/backend/verification/verifyPatch";
import { CancelledError, ProviderError } from "./llmProvider";

export type Emit = (event: StreamEventInput) => void;

export function isCancellation(err: unknown, signal: AbortSignal): boolean {
  return signal.aborted || err instanceof CancelledError;
}

export function toRunError(err: unknown): RunError {
  if (err instanceof ProviderError) {
    const transient = err.code === "PROVIDER_TIMEOUT" || err.code === "INVALID_MODEL_OUTPUT";
    return { code: err.code, message: err.message, retryable: err.retryable || transient };
  }
  console.error("[audit] unexpected pipeline error:", err instanceof Error ? err.name : typeof err);
  return { code: "INTERNAL", message: "Unexpected server error during the audit.", retryable: true };
}

interface VerifyStage {
  emit: Emit;
  signal: AbortSignal;
  runner: IsolatedRunner;
  source: string;
  language: SupportedLanguage;
  red: RedResult;
  blue: BlueResult;
}

/** Runs real verification on the proposed patch and emits the final outcome. */
export async function verifyAndComplete({ emit, signal, runner, source, language, red, blue }: VerifyStage) {
  emit({ type: "phase", phase: "VERIFYING" });
  emit({
    type: "log",
    agent: "VERIFIER",
    illustrative: false,
    text: "Verifying the proposed patch: parse/type checks run without executing code; fixture execution only in an isolated runner.",
  });
  const verification = await verifyPatch({ original: source, patched: blue.patchedCode, language, red, runner, signal });
  for (const c of verification.checks) {
    emit({ type: "log", agent: "VERIFIER", illustrative: false, text: `${c.status} · ${c.label} — ${c.detail}`.slice(0, 2000) });
  }
  emit({ type: "verification.result", result: verification });
  emit({ type: "run.completed", outcome: deriveOutcome(red, blue, verification) });
}
