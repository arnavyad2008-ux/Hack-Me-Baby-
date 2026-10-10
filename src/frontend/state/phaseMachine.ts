import type { ArenaPhase } from "@/shared/types";

const ACTIVE: ReadonlySet<ArenaPhase> = new Set(["RED_ANALYSIS", "BLUE_PATCH", "VERIFYING"]);

const TRANSITIONS: Record<ArenaPhase, readonly ArenaPhase[]> = {
  IDLE: ["RED_ANALYSIS"],
  RED_ANALYSIS: ["BLUE_PATCH", "VERIFYING", "COMPLETED", "FAILED", "CANCELLED"],
  BLUE_PATCH: ["VERIFYING", "COMPLETED", "FAILED", "CANCELLED"],
  VERIFYING: ["COMPLETED", "FAILED", "CANCELLED"],
  COMPLETED: ["RED_ANALYSIS", "IDLE"],
  FAILED: ["RED_ANALYSIS", "IDLE"],
  CANCELLED: ["RED_ANALYSIS", "IDLE"],
};

export function isActivePhase(phase: ArenaPhase): boolean {
  return ACTIVE.has(phase);
}

export function canTransition(from: ArenaPhase, to: ArenaPhase): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}
