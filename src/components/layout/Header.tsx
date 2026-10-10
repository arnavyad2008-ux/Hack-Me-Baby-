"use client";

import React from "react";
import { ShieldAlert, Play, RotateCcw, Volume2, VolumeX, Square } from "lucide-react";
import { useCyberArena } from "@/hooks/useCyberArenaState";
import { useAgentStream } from "@/hooks/useAgentStream";
import { getAllPresets } from "@/lib/agents/vulnerabilityDatabase";

export function Header() {
  const {
    phase,
    activePresetId,
    loadPreset,
    resetArena,
    soundEnabled,
    toggleSound,
  } = useCyberArena();
  const { isStreaming, startAudit, abortAudit } = useAgentStream();
  const presets = getAllPresets();

  const getPhaseBadge = () => {
    switch (phase) {
      case "RED_RECON":
        return <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyber-red/20 text-cyber-red border border-cyber-red animate-pulse">RED RECON</span>;
      case "RED_EXPLOIT":
        return <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyber-red text-black border border-cyber-red animate-bounce">EXPLOIT ACTIVE</span>;
      case "BLUE_INTERCEPT":
        return <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyber-blue/20 text-cyber-blue border border-cyber-blue animate-pulse">INTERCEPTING</span>;
      case "BLUE_PATCH":
        return <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyber-blue/30 text-cyber-blue border border-cyber-blue">SYNTHESIZING PATCH</span>;
      case "RESOLVED":
        return <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500">SYSTEM SECURED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-xs font-mono text-slate-400 border border-slate-700">STANDBY</span>;
    }
  };

  return (
    <header className="h-16 border-b border-cyber-border bg-cyber-bg/95 backdrop-blur px-6 flex items-center justify-between shrink-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-cyber-red animate-pulse" />
          <h1 className="text-lg font-black tracking-wider text-slate-100 font-mono">
            HACK<span className="text-cyber-red">ME</span><span className="text-cyber-blue">BABY</span>
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-4">
          <span className="text-xs text-slate-500 font-mono">PHASE:</span>
          {getPhaseBadge()}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={activePresetId}
          disabled={isStreaming}
          onChange={(e) => loadPreset(e.target.value)}
          aria-label="Preset Scenario"
          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 font-mono focus:outline-none focus:border-cyber-blue disabled:opacity-50"
        >
          {presets.map((p) => (
            <option key={p.snippet.id} value={p.snippet.id}>
              {p.snippet.name}
            </option>
          ))}
        </select>

        <button
          onClick={toggleSound}
          title={soundEnabled ? "Mute audio" : "Enable audio"}
          aria-label={soundEnabled ? "Mute audio" : "Enable audio"}
          className="p-2 rounded border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyber-blue" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={resetArena}
          disabled={isStreaming}
          title="Reset Arena"
          aria-label="Reset Arena"
          className="p-2 rounded border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {isStreaming ? (
          <button
            onClick={abortAudit}
            className="flex items-center gap-2 px-4 py-1.5 rounded text-xs font-mono font-bold bg-cyber-red/20 text-cyber-red border border-cyber-red hover:bg-cyber-red hover:text-black transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            ABORT
          </button>
        ) : (
          <button
            onClick={startAudit}
            className="flex items-center gap-2 px-4 py-1.5 rounded text-xs font-mono font-bold bg-cyber-red text-black border border-cyber-red hover:bg-cyber-red-glow shadow-red-glow transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            SIMULATE AUDIT
          </button>
        )}
      </div>
    </header>
  );
}
