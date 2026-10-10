"use client";

import React, { useEffect, useRef } from "react";
import { Skull, AlertTriangle, Crosshair } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { TerminalHeader } from "./TerminalHeader";
import { TerminalLogLine } from "./TerminalLogLine";
import { getSeverityColor } from "@/shared/utils/formatters";

export function RedBotTerminal() {
  const { redBotStream, activeVulnerability, phase } = useCyberArena();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [redBotStream, activeVulnerability]);

  const isScanning = phase === "RED_RECON" || phase === "RED_EXPLOIT";

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
          <div className="mt-3 p-3 rounded border border-cyber-red/50 bg-cyber-red-dark/30 shadow-red-glow animate-pulse">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-cyber-red flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                VULNERABILITY CONFIRMED
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getSeverityColor(
                  activeVulnerability.severity
                )}`}
              >
                {activeVulnerability.severity}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-200">
              {activeVulnerability.title}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {activeVulnerability.description}
            </div>
            <div className="mt-2 p-1.5 rounded bg-black/60 border border-cyber-red/30 text-[11px] text-cyber-red font-mono break-all">
              PAYLOAD: {activeVulnerability.sampleExploitPayload}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
