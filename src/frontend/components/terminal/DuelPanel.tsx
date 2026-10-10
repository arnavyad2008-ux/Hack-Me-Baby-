"use client";

import React, { useState } from "react";
import { Swords, Send, Loader2 } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { sendDuelProbe } from "@/frontend/services/duelClient";
import { isActivePhase } from "@/frontend/state/phaseMachine";
import type { DuelProbeResult } from "@/shared/types";

/** Lets the user try their own login input against original vs. patched code in the SQLi fixture. */
export function DuelPanel() {
  const run = useCyberArena((s) => s.run);
  const patched = useCyberArena((s) => s.blue?.patchedCode ?? null);
  const running = useCyberArena((s) => isActivePhase(s.phase));
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<DuelProbeResult | null>(null);
  const [isFiring, setIsFiring] = useState(false);

  const ready = Boolean(run && patched && !running);

  const fire = async () => {
    if (!run || !patched || !username.trim()) return;
    setIsFiring(true);
    setResult(await sendDuelProbe({ original: run.code, patched, language: run.language, username, password: "x" }));
    setIsFiring(false);
  };

  return (
    <div className="p-2 border-t border-slate-800 bg-slate-900/90 font-mono text-xs">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1.5 text-[11px] font-bold">
        <Swords className="w-3.5 h-3.5 text-cyber-red" aria-hidden />
        <span>DUEL: PROBE THE SQLi FIXTURE</span>
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.slice(0, 200))}
          placeholder={ready ? "username to try, e.g. ' OR 1=1 --" : "available after a patch is proposed"}
          aria-label="Username probe"
          disabled={!ready}
          className="flex-1 min-w-0 bg-black/70 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyber-red disabled:opacity-50"
        />
        <button
          onClick={fire}
          disabled={!ready || isFiring || !username.trim()}
          className="px-2.5 py-1 bg-cyber-red text-black font-bold rounded text-xs hover:bg-cyber-red-glow transition-all flex items-center gap-1 disabled:opacity-40"
        >
          {isFiring ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden /> : <Send className="w-3 h-3" aria-hidden />}
          <span>PROBE</span>
        </button>
      </div>
      {result && (
        <div role="status" className="mt-1.5 p-1.5 rounded text-[10px] border border-slate-700 text-slate-300 space-y-0.5">
          {result.available ? (
            <>
              <div>Original: <b className="text-cyber-red">{result.original}</b></div>
              <div>Patched: <b className="text-emerald-400">{result.candidate}</b></div>
            </>
          ) : (
            <div className="text-cyber-warning">Not run: {result.message}</div>
          )}
        </div>
      )}
    </div>
  );
}
