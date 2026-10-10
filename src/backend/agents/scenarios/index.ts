import "server-only";
import type { PresetId } from "@/shared/presets/snippets";
import { rceScenario } from "./rcePreset";
import { sqliScenario } from "./sqliPreset";
import { ssrfScenario } from "./ssrfPreset";
import type { DemoScenario } from "./types";

export type { DemoScenario };

const DEMO_SCENARIOS: Record<PresetId, DemoScenario> = {
  "sql-injection": sqliScenario,
  "ssrf-webhook": ssrfScenario,
  "rce-command": rceScenario,
};

export function getDemoScenario(id: PresetId): DemoScenario {
  return DEMO_SCENARIOS[id];
}
