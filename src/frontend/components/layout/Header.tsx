"use client";

import React from "react";
import { ShieldAlert, Play, RotateCcw, Volume2, VolumeX, Square, GitBranch } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { useAgentStream } from "@/frontend/hooks/useAgentStream";
import { ALL_PRESET_SNIPPETS, isPresetId } from "@/shared/presets/snippets";
import { ModeToggle } from "./ModeToggle";
import { PhaseBadge } from "./PhaseBadge";

export function Header() {
  const presetId = useCyberArena((s) => s.target.presetId);
  const mode = useCyberArena((s) => s.mode);
  const loadPreset = useCyberArena((s) => s.loadPreset);
  const resetArena = useCyberArena((s) => s.resetArena);
  const soundEnabled = useCyberArena((s) => s.soundEnabled);
  const toggleSound = useCyberArena((s) => s.toggleSound);
  const setRepoModalOpen = useCyberArena((s) => s.setRepoModalOpen);
  const { isRunning, startAudit, cancelAudit } = useAgentStream();

  return (
    <header className="min-h-16 border-b border-cyber-border bg-cyber-bg/95 backdrop-blur px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 z-30 font-mono text-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-cyber-red" aria-hidden />
          <h1 className="text-lg font-black tracking-wider text-slate-100">
            HACK<span className="text-cyber-red">ME</span><span className="text-cyber-blue">BABY</span>
          </h1>
        </div>
        <div className="hidden lg:flex items-center gap-2 border-l border-slate-800 pl-4" aria-live="polite">
          <span className="text-slate-500">STATUS:</span>
          <PhaseBadge />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRepoModalOpen(true)}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-cyber-blue transition-colors disabled:opacity-40"
          title="Load a file from a GitHub repo or check a URL's headers"
        >
          <GitBranch className="w-3.5 h-3.5 text-cyber-blue" aria-hidden />
          <span className="hidden sm:inline">URL Ingest</span>
        </button>

        <ModeToggle />

        <select
          value={presetId ?? ""}
          disabled={isRunning}
          onChange={(e) => isPresetId(e.target.value) && loadPreset(e.target.value)}
          aria-label="Preset scenario"
          className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyber-blue disabled:opacity-50 max-w-[12rem]"
        >
          {presetId === null && <option value="">Custom code</option>}
          {ALL_PRESET_SNIPPETS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
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
          disabled={isRunning}
          title="Reset to the default preset"
          aria-label="Reset to the default preset"
          className="p-1.5 rounded border border-slate-800 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {isRunning ? (
          <button
            onClick={cancelAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-bold bg-cyber-red/20 text-cyber-red border border-cyber-red hover:bg-cyber-red hover:text-black transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" aria-hidden />
            <span>CANCEL</span>
          </button>
        ) : (
          <button
            onClick={startAudit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded font-bold bg-cyber-red text-black border border-cyber-red hover:bg-cyber-red-glow shadow-red-glow transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden />
            <span>{mode === "DEMO" ? "PLAY DEMO" : "RUN LIVE AUDIT"}</span>
          </button>
        )}
      </div>
    </header>
  );
}
