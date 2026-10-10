"use client";

import React, { useEffect, useRef } from "react";
import { Shield, ShieldCheck, Cpu } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { TerminalHeader } from "./TerminalHeader";
import { TerminalLogLine } from "./TerminalLogLine";

export function BlueBotTerminal() {
  const { blueBotStream, phase, scorecard } = useCyberArena();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [blueBotStream, scorecard]);

  const isDefending =
    phase === "BLUE_INTERCEPT" || phase === "BLUE_PATCH" || phase === "RESOLVED";

  return (
    <div className="flex flex-col h-full bg-slate-950/80">
      <TerminalHeader
        title="BLUE AGENT // DEFENSE BOT"
        agentRole="BLUE"
        statusText={isDefending ? "INTERCEPTING" : "DEFENSE READY"}
        icon={<Shield className="w-4 h-4 text-cyber-blue" />}
      />

      <div className="flex-1 p-3 overflow-y-auto space-y-2 font-mono">
        {blueBotStream.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-600 text-xs">
            <Cpu className="w-8 h-8 mb-2 text-slate-700 animate-pulse" />
            <span>SENTINEL ACTIVE // MONITORING SYSTEM VECTORS</span>
          </div>
        ) : (
          blueBotStream.map((log, idx) => (
            <TerminalLogLine key={idx} log={log} isRed={false} />
          ))
        )}

        {scorecard && (
          <div className="mt-3 p-3 rounded border border-cyber-blue/50 bg-cyber-blue-dark/30 shadow-blue-glow">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyber-blue mb-1">
              <ShieldCheck className="w-4 h-4" />
              REMEDIATION COMPLETE
            </div>
            <div className="text-xs text-slate-300">
              Mitigation status: <span className="text-emerald-400 font-bold">{scorecard.mitigationStatus}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Score: {scorecard.postPatchRiskScore} / 10 (Reduced by {scorecard.cvssReduction} CVSS)
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
