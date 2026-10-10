"use client";

import React from "react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { OUTCOME_LABELS } from "@/shared/contracts/verification";

const base = "px-2 py-0.5 rounded text-[11px] font-mono font-bold border";

export function PhaseBadge() {
  const phase = useCyberArena((s) => s.phase);
  const outcome = useCyberArena((s) => s.outcome);

  switch (phase) {
    case "RED_ANALYSIS":
      return <span className={`${base} bg-cyber-red/20 text-cyber-red border-cyber-red animate-pulse`}>RED ANALYSIS</span>;
    case "BLUE_PATCH":
      return <span className={`${base} bg-cyber-blue/20 text-cyber-blue border-cyber-blue animate-pulse`}>BLUE PATCHING</span>;
    case "VERIFYING":
      return <span className={`${base} bg-cyber-warning/20 text-cyber-warning border-cyber-warning animate-pulse`}>VERIFYING</span>;
    case "COMPLETED": {
      const good = outcome === "CHECKS_PASSED";
      const bad = outcome === "VERIFICATION_FAILED";
      const tone = good
        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500"
        : bad
          ? "bg-cyber-red/20 text-cyber-red border-cyber-red"
          : "bg-slate-800 text-slate-200 border-slate-600";
      return <span className={`${base} ${tone}`}>{outcome ? OUTCOME_LABELS[outcome].toUpperCase() : "COMPLETED"}</span>;
    }
    case "FAILED":
      return <span className={`${base} bg-cyber-red/20 text-cyber-red border-cyber-red`}>FAILED</span>;
    case "CANCELLED":
      return <span className={`${base} text-slate-300 border-slate-600`}>CANCELLED</span>;
    default:
      return <span className={`${base} font-normal text-slate-400 border-slate-700`}>TARGET READY</span>;
  }
}
