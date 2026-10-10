import type { BlueResult, ModelRedOutput } from "@/shared/contracts/findings";
import type { PresetId } from "@/shared/presets/snippets";

/** Recorded demo content. Everything here is illustrative playback, not tool output. */
export interface DemoScenario {
  presetId: PresetId;
  red: ModelRedOutput;
  blue: BlueResult;
  redNarration: string[];
  blueNarration: string[];
}
