"use client";

import React from "react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { isActivePhase } from "@/frontend/state/phaseMachine";
import type { AuditMode } from "@/shared/contracts/events";

const OPTIONS: Array<{ mode: AuditMode; label: string; title: string }> = [
  { mode: "DEMO", label: "Demo", title: "Replay recorded results for an unmodified preset (simulation, no credentials needed)" },
  { mode: "LIVE", label: "Live", title: "Real model analysis of the exact code in the editor" },
];

export function ModeToggle() {
  const mode = useCyberArena((s) => s.mode);
  const setMode = useCyberArena((s) => s.setMode);
  const running = useCyberArena((s) => isActivePhase(s.phase));
  const isPreset = useCyberArena((s) => s.target.presetId !== null);

  return (
    <div role="radiogroup" aria-label="Audit mode" className="flex bg-slate-950 p-0.5 rounded border border-slate-700">
      {OPTIONS.map((o) => {
        const disabled = running || (o.mode === "DEMO" && !isPreset);
        return (
          <button
            key={o.mode}
            role="radio"
            aria-checked={mode === o.mode}
            disabled={disabled}
            title={o.mode === "DEMO" && !isPreset ? "Demo replays only unmodified presets" : o.title}
            onClick={() => setMode(o.mode)}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors disabled:opacity-40 ${
              mode === o.mode
                ? o.mode === "DEMO" ? "bg-cyber-warning text-black" : "bg-cyber-blue text-black"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
