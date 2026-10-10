import "server-only";
import type { AuditRequest } from "@/shared/contracts/events";
import { getPresetSnippet, type PresetId } from "@/shared/presets/snippets";
import { validateBlueOutput } from "@/backend/agents/blueTeam/blueAgent";
import { validateRedOutput } from "@/backend/agents/redTeam/redAgent";
import { getDemoScenario } from "@/backend/agents/scenarios";
import type { IsolatedRunner } from "@/backend/verification/isolatedRunner";
import { abortableDelay } from "./llmProvider";
import { verifyAndComplete, type Emit } from "./pipelineSupport";

export interface DemoDeps {
  runner: IsolatedRunner;
  /** Presentation pacing only; set to 0 in tests. */
  stepDelayMs: number;
}

/**
 * Demo mode: replays recorded Red/Blue results for an unmodified preset (marked
 * illustrative), then runs the same real verification as Live mode on the recorded patch.
 */
export async function runDemoPlayback(
  request: AuditRequest,
  presetId: PresetId,
  emit: Emit,
  signal: AbortSignal,
  deps: DemoDeps
) {
  const scenario = getDemoScenario(presetId);
  const preset = getPresetSnippet(presetId);
  const pause = () => abortableDelay(deps.stepDelayMs, signal);
  const say = (agent: "RED" | "BLUE", text: string) => emit({ type: "log", agent, illustrative: true, text });

  emit({ type: "run.started", mode: "DEMO", illustrative: true });
  emit({ type: "phase", phase: "RED_ANALYSIS" });
  say("RED", `DEMO PLAYBACK — replaying a recorded analysis of "${preset.name}". No model is called.`);
  await pause();
  for (const line of scenario.redNarration) {
    say("RED", line);
    await pause();
  }
  const red = validateRedOutput(scenario.red, request.code);
  emit({ type: "red.result", result: red, illustrative: true });

  emit({ type: "phase", phase: "BLUE_PATCH" });
  say("BLUE", "DEMO PLAYBACK — replaying a recorded patch proposal.");
  await pause();
  for (const line of scenario.blueNarration) {
    say("BLUE", line);
    await pause();
  }
  const blue = validateBlueOutput(scenario.blue, red, request.code);
  emit({ type: "blue.result", result: blue, illustrative: true });

  await verifyAndComplete({ emit, signal, runner: deps.runner, source: request.code, language: request.language, red, blue });
}
