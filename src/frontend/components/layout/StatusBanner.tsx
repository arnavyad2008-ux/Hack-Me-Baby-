"use client";

import React from "react";
import { AlertTriangle, Info, RotateCcw, RefreshCw } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { useAgentStream } from "@/frontend/hooks/useAgentStream";
import { useCapabilities } from "@/frontend/hooks/useCapabilities";

/** Mode labelling, configuration hints and actionable run errors. */
export function StatusBanner() {
  const mode = useCyberArena((s) => s.mode);
  const phase = useCyberArena((s) => s.phase);
  const error = useCyberArena((s) => s.error);
  const resetArena = useCyberArena((s) => s.resetArena);
  const { startAudit } = useAgentStream();
  const caps = useCapabilities();

  if (phase === "FAILED" && error) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-cyber-red/60 bg-cyber-red/10 font-mono text-xs text-slate-200">
        <AlertTriangle className="w-4 h-4 text-cyber-red shrink-0" aria-hidden />
        <span className="font-bold text-cyber-red">{error.code.replace(/_/g, " ")}</span>
        <span className="flex-1 min-w-[12rem]">{error.message}</span>
        {error.retryable && (
          <button onClick={startAudit} className="flex items-center gap-1 px-2 py-1 rounded border border-cyber-red text-cyber-red hover:bg-cyber-red hover:text-black">
            <RefreshCw className="w-3 h-3" aria-hidden /> Retry
          </button>
        )}
        <button onClick={resetArena} className="flex items-center gap-1 px-2 py-1 rounded border border-slate-600 text-slate-300 hover:text-white">
          <RotateCcw className="w-3 h-3" aria-hidden /> Reset
        </button>
      </div>
    );
  }

  if (mode === "DEMO") {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-cyber-warning/40 bg-cyber-warning/10 font-mono text-[11px] text-slate-200">
        <Info className="w-3.5 h-3.5 text-cyber-warning shrink-0" aria-hidden />
        <span>
          <b className="text-cyber-warning">DEMO MODE — simulation.</b> Red/Blue output is recorded playback, not a live analysis.
          Verification of the recorded patch is real.
        </span>
      </div>
    );
  }

  if (caps && !caps.live.configured) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-cyber-red/40 bg-cyber-red/10 font-mono text-[11px] text-slate-200">
        <AlertTriangle className="w-3.5 h-3.5 text-cyber-red shrink-0" aria-hidden />
        <span>
          <b className="text-cyber-red">Live mode is not configured.</b> Set HF_TOKEN on the server (see .env.example), or switch to Demo.
        </span>
      </div>
    );
  }
  return null;
}
