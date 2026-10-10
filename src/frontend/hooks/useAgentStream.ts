import { useEffect } from "react";
import { cancelAuditRun, startAuditRun } from "@/frontend/services/auditRunner";
import { isActivePhase } from "@/frontend/state/phaseMachine";
import { useCyberArena } from "./useCyberArenaState";

/** Run controls. Safe to call from any number of components. */
export function useAgentStream() {
  const isRunning = useCyberArena((s) => isActivePhase(s.phase));
  return {
    isRunning,
    startAudit: () => void startAuditRun(),
    cancelAudit: cancelAuditRun,
  };
}

/** Mount once at the page root: cancels any in-flight run when the page unmounts. */
export function useAuditLifecycle() {
  useEffect(() => () => cancelAuditRun(), []);
}
