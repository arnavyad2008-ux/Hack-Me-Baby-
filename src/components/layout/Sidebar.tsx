"use client";

import React from "react";
import { Database, ShieldCheck, Bug, Terminal, Cpu } from "lucide-react";
import { useCyberArena } from "@/hooks/useCyberArenaState";
import { getAllPresets } from "@/lib/agents/vulnerabilityDatabase";

export function Sidebar() {
  const { activePresetId, loadPreset, phase, activeVulnerability } = useCyberArena();
  const presets = getAllPresets();

  return (
    <aside className="w-64 border-r border-cyber-border bg-cyber-panel/60 p-4 hidden lg:flex flex-col gap-6 shrink-0 z-20">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-3 uppercase tracking-wider">
          <Database className="w-3.5 h-3.5 text-cyber-blue" />
          <span>Vulnerability Targets</span>
        </div>
        <div className="flex flex-col gap-2">
          {presets.map((preset) => {
            const isSelected = activePresetId === preset.snippet.id;
            return (
              <button
                key={preset.snippet.id}
                onClick={() => loadPreset(preset.snippet.id)}
                className={`text-left p-2.5 rounded border text-xs font-mono transition-all ${
                  isSelected
                    ? "bg-cyber-blue/10 border-cyber-blue text-cyber-blue shadow-blue-glow"
                    : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                <div className="font-semibold text-slate-200">{preset.snippet.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{preset.snippet.vulnerabilityType}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-800/80 pt-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5 text-cyber-red" />
          <span>Telemetry Stream</span>
        </div>
        <div className="p-3 rounded border border-slate-800 bg-slate-900/60 font-mono text-xs space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>State Engine:</span>
            <span className="text-cyber-neon font-bold">{phase}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Active CWE:</span>
            <span className="text-cyber-red font-bold">
              {activeVulnerability ? activeVulnerability.cwe : "AWAITING"}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Severity:</span>
            <span className="text-orange-400 font-bold">
              {activeVulnerability ? activeVulnerability.severity : "NONE"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-slate-800/80 pt-4 text-[11px] font-mono text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-cyber-blue" /> v2.4 DUAL-AGENT
        </span>
        <span className="flex items-center gap-1 text-emerald-400">
          <ShieldCheck className="w-3 h-3" /> SECURE
        </span>
      </div>
    </aside>
  );
}
