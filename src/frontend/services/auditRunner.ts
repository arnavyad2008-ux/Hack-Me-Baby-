import { AuditRequestSchema, type AuditRequest, type RunError } from "@/shared/contracts/events";
import { useCyberArena, type ArenaState, type RunSnapshot } from "@/frontend/hooks/useCyberArenaState";
import { isActivePhase } from "@/frontend/state/phaseMachine";
import { AuditClientError, streamAudit } from "./auditStreamClient";

/** The single in-flight run for this page. Only one run may be active at a time. */
let active: { runId: string; controller: AbortController } | null = null;

export function buildAuditRequest(snapshot: RunSnapshot): AuditRequest {
  return {
    runId: snapshot.runId,
    mode: snapshot.mode,
    code: snapshot.code,
    language: snapshot.language,
    // Preset identity is only meaningful for demo playback; Live audits the code alone.
    ...(snapshot.mode === "DEMO" && snapshot.presetId ? { presetId: snapshot.presetId } : {}),
  };
}

export function snapshotFromState(state: Pick<ArenaState, "mode" | "target">, runId: string): RunSnapshot {
  return { ...state.target, runId, mode: state.mode };
}

function toRunError(err: unknown): RunError {
  if (err instanceof AuditClientError) return err.runError;
  return { code: "STREAM_ERROR", message: "Network error while streaming the audit.", retryable: true };
}

export async function startAuditRun(fetchImpl: typeof fetch = fetch): Promise<void> {
  const state = useCyberArena.getState();
  if (active || isActivePhase(state.phase)) return;

  const snapshot = snapshotFromState(state, crypto.randomUUID());
  if (!state.beginRun(snapshot)) return;
  const request = buildAuditRequest(snapshot);
  const valid = AuditRequestSchema.safeParse(request);
  if (!valid.success) {
    const message = valid.error.issues[0]?.message ?? "Invalid audit request.";
    useCyberArena.getState().failRun(snapshot.runId, { code: "UNSUPPORTED_INPUT", message, retryable: false });
    return;
  }

  const controller = new AbortController();
  active = { runId: snapshot.runId, controller };
  try {
    await streamAudit(valid.data, {
      signal: controller.signal,
      onEvent: (event) => useCyberArena.getState().applyEvent(event),
      fetchImpl,
    });
  } catch (err) {
    const store = useCyberArena.getState();
    if (controller.signal.aborted) store.cancelRun(snapshot.runId);
    else store.failRun(snapshot.runId, toRunError(err));
  } finally {
    if (active?.runId === snapshot.runId) active = null;
  }
}

/** Aborts the in-flight request and immediately restores usable controls. */
export function cancelAuditRun(): void {
  if (!active) return;
  const { runId, controller } = active;
  active = null;
  controller.abort();
  useCyberArena.getState().cancelRun(runId);
}
