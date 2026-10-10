"use client";

import React, { useState } from "react";
import { Terminal, Play, CheckCircle2, AlertOctagon, Box, RefreshCw } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";

export function SandboxView() {
  const { patchedCode, activeVulnerability } = useCyberArena();
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState(4);

  const runSimulation = () => {
    setIsRunning(true);
    setStep(0);
    const intervals = [800, 1600, 2400, 3200];
    intervals.forEach((delay, idx) => {
      setTimeout(() => {
        setStep(idx + 1);
        if (idx === intervals.length - 1) setIsRunning(false);
      }, delay);
    });
  };

  const payload = activeVulnerability?.sampleExploitPayload || "' OR '1'='1' --";

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/95 font-mono text-xs p-4 overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-cyber-blue" />
          <span className="font-bold text-slate-200">EPHEMERAL DAST DOCKER CONTAINER</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            PID: 4981 [node:20-alpine]
          </span>
        </div>
        <button
          onClick={runSimulation}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyber-blue/10 border border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-black transition-all text-[11px]"
        >
          <RefreshCw className={`w-3 h-3 ${isRunning ? "animate-spin" : ""}`} />
          <span>RE-RUN CONTAINER DAST</span>
        </button>
      </div>

      <div className="space-y-3 mt-4">
        <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
          <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">PHASE 1: LIVE EXPLOITATION PROBE (BEFORE PATCH)</div>
          <div className="text-slate-300">
            <span className="text-cyber-red font-bold">[RED EXPLOIT]</span> POST http://127.0.0.1:8080/api/target
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">Payload: <code className="text-cyber-red">{payload}</code></div>
          <div className="mt-2 flex items-center gap-1.5 text-cyber-red font-bold">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>RESULT: HTTP 200 OK // [!] ARBITRARY CONTROL-FLOW HIJACK CONFIRMED</span>
          </div>
        </div>

        {step >= 2 && (
          <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">PHASE 2: CONTAINER DEFENSE REMEDIATION</div>
            <div className="text-slate-300">
              <span className="text-cyber-blue font-bold">[BLUE SENTINEL]</span> Hot-reloading AST defensive patch into PID 4981 container...
            </div>
            <div className="text-emerald-400 text-[11px] mt-1">
              {patchedCode ? "Defensive patch verified. Bound parameters active." : "Compiling Blue Sentinel bounds..."}
            </div>
          </div>
        )}

        {step >= 4 && (
          <div className="p-3 rounded bg-slate-900/60 border border-emerald-500/30 bg-emerald-500/5">
            <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">PHASE 3: RE-TESTING EXPLOIT ON SECURED CONTAINER</div>
            <div className="text-slate-300">
              <span className="text-cyber-blue font-bold">[VERIFY]</span> POST http://127.0.0.1:8080/api/target (Identical probe payload)
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>RESULT: HTTP 403 FORBIDDEN // [✓] ZERO-TRUST BOUNDARY BLOCKED INJECTION</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
