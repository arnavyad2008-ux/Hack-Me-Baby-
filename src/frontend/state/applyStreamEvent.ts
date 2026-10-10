import type { StreamEvent } from "@/shared/contracts/events";
import type { LogLine } from "@/shared/types";
import type { ArenaData, RunResults } from "./arenaTypes";
import { canTransition, isActivePhase } from "./phaseMachine";

let nextLogId = 1;

export function makeLog(text: string, agent: LogLine["agent"], illustrative: boolean): LogLine {
  return { id: nextLogId++, text, agent, illustrative, at: Date.now() };
}

export function emptyResults(): RunResults {
  return {
    redLogs: [], blueLogs: [], red: null, blue: null, verification: null, outcome: null, error: null, illustrative: false,
  };
}

/**
 * Pure reducer for server events. Returns null when the event must be ignored:
 * it belongs to another run, or the run is no longer active (cancelled/finished).
 */
export function applyStreamEvent(state: ArenaData, event: StreamEvent): Partial<ArenaData> | null {
  if (!state.run || event.runId !== state.run.runId || !isActivePhase(state.phase)) return null;

  switch (event.type) {
    case "run.started":
      return { illustrative: event.illustrative };
    case "phase":
      if (!canTransition(state.phase, event.phase)) {
        return { phase: "FAILED", error: { code: "STREAM_ERROR", message: `Unexpected phase order (${state.phase} → ${event.phase}).`, retryable: true } };
      }
      return { phase: event.phase };
    case "log": {
      const line = makeLog(event.text, event.agent, event.illustrative);
      return event.agent === "RED" ? { redLogs: [...state.redLogs, line] } : { blueLogs: [...state.blueLogs, line] };
    }
    case "red.result":
      return { red: event.result };
    case "blue.result":
      return event.result.patchedCode ? { blue: event.result, editorView: "DIFF" } : { blue: event.result };
    case "verification.result":
      return { verification: event.result };
    case "run.completed":
      return { phase: "COMPLETED", outcome: event.outcome };
    case "run.error":
      return { phase: "FAILED", error: event.error };
  }
}
