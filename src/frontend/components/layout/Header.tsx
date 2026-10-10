"use client";

import React from "react";
import { ShieldAlert, Play, RotateCcw, Volume2, VolumeX, Square, GitBranch, Cpu } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { useAgentStream } from "@/frontend/hooks/useAgentStream";
import { getAllPresets } from "@/backend/agents/scenarios/vulnerabilityDatabase";
import { AIMode } from "@/shared/types";

export function Header() {
  const {
    phase,
    activePresetId,
    loadPreset,
    resetArena,
    soundEnabled,
    toggleSound,
    aiMode,
    setAiMode,
    setRepoModalOpen,
  } = useCyberArena();
  const { isStreaming, startAudit, abortAudit } = useAgentStream();
  const presets = getAllPresets();

  const getPhaseBadge = () => {
    switch (phase) {
      case "RED_RECON":
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyber-red/20 text-cyber-red border border-cyber-red animate-pulse">RED RECON</span>;
      case "RED_EXPLOIT":
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyber-red text-black border border-cyber-red animate-bounce">EXPLOIT ACTIVE</span>;
      case "BLUE_INTERCEPT":
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyber-blue/20 text-cyber-blue border border-cyber-blue animate-pulse">INTERCEPTING</span>;
      case "BLUE_PATCH":
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyber-blue/30 text-cyber-blue border border-cyber-blue">SYNTHESIZING</span>;
      case "RESOLVED":
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500">SYSTEM SECURED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 border border-slate-700">STANDBY</span>;
    }
  };

  return (
    <header className="h-16 border-b border-cyber-border bg-cyber-bg/95 backdrop-blur px-6 flex items-center justify-between shrink-0 z-30 font-mono text-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-cyber-red animate-pulse" />
          <h1 className="text-lg font-black tracking-wider text-slate-100">
            HACK<span className="text-cyber-red">ME</span><span className="text-cyber-blue">BABY</span>
          </h1>
        </div>
        <div className="hidden lg:flex items-center gap-2 border-l border-slate-800 pl-4">
          <span className="text-slate-500">PHASE:</span>
          {getPhaseBadge()}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Target Ingest (Git & Web) Button */}
        <button
          onClick={() => setRepoModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-cyber-blue transition-colors"
          title="Ingest GitHub repo or Live Website URL"
        >
          <GitBranch className="w-3.5 h-3.5 text-cyber-blue" />
          <span className="hidden sm:inline">URL Ingest</span>
        </button>

        {/* AI Brain Switcher */}
        <select
          value={aiMode}
          onChange={(e) => setAiMode(e.target.value as AIMode)}
          aria-label="AI Brain Engine"
          className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyber-blue"
        >
          <option value="HUGGING_FACE">🌐 Brain: Hugging Face (Qwen 2.5)</option>
          <option value="SIMMY_LOCAL">🔒 Brain: Simmy (Air-Gapped)</option>
          <option value="STATIC_AST">⚡ Brain: Static AST Engine</option>
        </select>

        {/* Presets */}
        <select
          value={activePresetId}
          disabled={isStreaming}
          onChange={(e) => loadPreset(e.target.value)}
          aria-label="Target Presets"
          className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyber-blue disabled:opacity-50"
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
          className="p-1.5 rounded border border-slate-800 text-slate-400 hover:text-white"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyber-blue" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={resetArena}
          disabled={isStreaming}
          title="Reset Arena"
          aria-label="Reset Arena"
          className="p-1.5 rounded border border-slate-800 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {isStreaming ? (
          <button
            onClick={abortAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-bold bg-cyber-red/20 text-cyber-red border border-cyber-red hover:bg-cyber-red hover:text-black transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>ABORT</span>
          </button>
        ) : (
          <button
            onClick={startAudit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded font-bold bg-cyber-red text-black border border-cyber-red hover:bg-cyber-red-glow shadow-red-glow transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>SIMULATE AUDIT</span>
          </button>
        )}
      </div>
    </header>
  );
}
