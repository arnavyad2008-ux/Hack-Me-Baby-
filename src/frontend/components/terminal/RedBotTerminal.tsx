"use client";

import React, { useEffect, useRef, useState } from "react";
import { Skull, AlertTriangle, Crosshair, Swords, Send } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { TerminalHeader } from "./TerminalHeader";
import { TerminalLogLine } from "./TerminalLogLine";
import { getSeverityColor } from "@/shared/utils/formatters";
import { DuelResponse } from "@/shared/types";

export function RedBotTerminal() {
  const { redBotStream, activeVulnerability, phase, targetCode, patchedCode, appendRedStream } =
    useCyberArena();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [duelPayload, setDuelPayload] = useState("");
  const [duelResult, setDuelResult] = useState<DuelResponse | null>(null);
  const [isFiring, setIsFiring] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [redBotStream, activeVulnerability, duelResult]);

  const isScanning = phase === "RED_RECON" || phase === "RED_EXPLOIT";

  const handleFireDuel = async () => {
    if (!duelPayload.trim()) return;
    setIsFiring(true);
    try {
      const res = await fetch("/api/duel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCode,
          patchedCode,
          customPayload: duelPayload,
        }),
      });
      const data: DuelResponse = await res.json();
      setDuelResult(data);
      appendRedStream(`[DUEL_MODE] Tested payload: "${duelPayload}" -> ${data.statusText}`);
    } finally {
      setIsFiring(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80">
      <TerminalHeader
        title="RED AGENT // EXPLOIT BOT"
        agentRole="RED"
        statusText={isScanning ? "ENGAGED" : "LISTENING"}
        icon={<Skull className="w-4 h-4 text-cyber-red" />}
      />

      <div className="flex-1 p-3 overflow-y-auto space-y-2 font-mono">
        {redBotStream.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-600 text-xs">
            <Crosshair className="w-8 h-8 mb-2 text-slate-700 animate-spin" />
            <span>STANDBY // AWAITING TARGET INGESTION</span>
          </div>
        ) : (
          redBotStream.map((log, idx) => (
            <TerminalLogLine key={idx} log={log} isRed={true} />
          ))
        )}

        {activeVulnerability && (
          <div className="mt-3 p-3 rounded border border-cyber-red/50 bg-cyber-red-dark/30 shadow-red-glow">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-cyber-red flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                VULNERABILITY CONFIRMED
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getSeverityColor(activeVulnerability.severity)}`}>
                {activeVulnerability.severity}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-200">{activeVulnerability.title}</div>
            <div className="mt-1.5 p-1.5 rounded bg-black/60 border border-cyber-red/30 text-[11px] text-cyber-red break-all">
              PAYLOAD: {activeVulnerability.sampleExploitPayload}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Interactive Duel Mode */}
      <div className="p-2 border-t border-slate-800 bg-slate-900/90 font-mono text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 mb-1.5 text-[11px] font-bold">
          <Swords className="w-3.5 h-3.5 text-cyber-red" />
          <span>INTERACTIVE DUEL MODE</span>
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={duelPayload}
            onChange={(e) => setDuelPayload(e.target.value)}
            placeholder="Type custom exploit payload..."
            className="flex-1 bg-black/70 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyber-red"
          />
          <button
            onClick={handleFireDuel}
            disabled={isFiring}
            className="px-2.5 py-1 bg-cyber-red text-black font-bold rounded text-xs hover:bg-cyber-red-glow transition-all flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
            <span>FIRE</span>
          </button>
        </div>
        {duelResult && (
          <div className={`mt-1.5 p-1.5 rounded text-[10px] border ${
            duelResult.bypassed
              ? "bg-cyber-red/10 border-cyber-red text-cyber-red"
              : "bg-emerald-500/10 border-emerald-500 text-emerald-400"
          }`}>
            {duelResult.feedback}
          </div>
        )}
      </div>
    </div>
  );
}
