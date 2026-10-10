"use client";

import React from "react";
import { Code2, GitCompare, Award } from "lucide-react";
import { useCyberArena } from "@/hooks/useCyberArenaState";

export function EditorHeader() {
  const { isDiffView, toggleDiffView, patchedCode, scorecard } = useCyberArena();

  return (
    <div className="h-10 px-4 bg-slate-900/90 border-b border-cyber-border flex items-center justify-between shrink-0 font-mono text-xs text-slate-300">
      <div className="flex items-center gap-2">
        <Code2 className="w-4 h-4 text-cyber-blue" />
        <span className="font-semibold text-slate-200">target_service.ts</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          TypeScript
        </span>
      </div>

      <div className="flex items-center gap-2">
        {patchedCode && (
          <button
            onClick={toggleDiffView}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              isDiffView
                ? "bg-cyber-blue/20 text-cyber-blue border border-cyber-blue"
                : "bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            {isDiffView ? "View Original" : "Compare Patch Diff"}
          </button>
        )}

        {scorecard && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500 font-bold">
            <Award className="w-3.5 h-3.5" />
            GRADE: {scorecard.defenseGrade}
          </span>
        )}
      </div>
    </div>
  );
}
