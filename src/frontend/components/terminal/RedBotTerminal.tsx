"use client";

import React, { useEffect, useRef } from "react";
import { Skull, Crosshair } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { TerminalHeader } from "./TerminalHeader";
import { TerminalLogLine } from "./TerminalLogLine";
import { FindingCard } from "./FindingCard";
import { DuelPanel } from "./DuelPanel";

export function RedBotTerminal() {
  const redLogs = useCyberArena((s) => s.redLogs);
  const red = useCyberArena((s) => s.red);
  const illustrative = useCyberArena((s) => s.illustrative);
  const isScanning = useCyberArena((s) => s.phase === "RED_ANALYSIS");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [redLogs, red]);

  return (
    <div className="flex flex-col h-full bg-slate-950/80">
      <TerminalHeader
        title="RED AGENT // FINDINGS"
        agentRole="RED"
        statusText={isScanning ? "ANALYZING" : red ? "REPORTED" : "IDLE"}
        icon={<Skull className="w-4 h-4 text-cyber-red" aria-hidden />}
      />

      <div className="flex-1 p-3 overflow-y-auto space-y-2 font-mono" aria-live="polite">
        {redLogs.length === 0 && !red ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-600 text-xs">
            <Crosshair className="w-8 h-8 mb-2 text-slate-700" aria-hidden />
            <span>Run an audit to see Red findings here.</span>
          </div>
        ) : (
          redLogs.map((line) => <TerminalLogLine key={line.id} line={line} />)
        )}

        {red && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-slate-300">{red.summary}</p>
            {red.findings.length === 0 && (
              <p className="text-xs text-slate-400">No findings reported. This is not proof that the code is safe.</p>
            )}
            {red.findings.map((f) => <FindingCard key={f.id} finding={f} illustrative={illustrative} />)}
            {red.missingContext.length > 0 && (
              <div className="text-[11px] text-slate-500">
                <div className="font-bold text-slate-400">Missing context</div>
                <ul className="list-disc pl-4">{red.missingContext.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <DuelPanel />
    </div>
  );
}
