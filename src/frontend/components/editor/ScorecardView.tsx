"use client";

import React from "react";
import { CheckCircle2, Award, ArrowDownRight } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";

export function ScorecardView() {
  const { scorecard } = useCyberArena();
  if (!scorecard) return null;

  return (
    <div className="p-4 bg-slate-900/95 border-t border-cyber-border font-mono text-xs text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-cyber-neon" />
          <span className="font-bold text-sm text-slate-100">DEFENSE VERIFICATION SCORECARD</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500 text-emerald-400 font-bold">
            GRADE: {scorecard.defenseGrade}
          </span>
          <span className="text-slate-400">
            OWASP: <span className="text-slate-200">{scorecard.owaspCategory}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 my-3">
        <div className="p-2.5 rounded bg-slate-800/40 border border-slate-700/60">
          <div className="text-[10px] text-slate-500">INITIAL RISK</div>
          <div className="text-sm font-bold text-cyber-red mt-0.5">{scorecard.initialRiskScore} / 10</div>
        </div>
        <div className="p-2.5 rounded bg-slate-800/40 border border-slate-700/60">
          <div className="text-[10px] text-slate-500">SECURED RISK</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">{scorecard.postPatchRiskScore} / 10</div>
        </div>
        <div className="p-2.5 rounded bg-slate-800/40 border border-slate-700/60">
          <div className="text-[10px] text-slate-500">CVSS REDUCTION</div>
          <div className="text-sm font-bold text-cyber-blue mt-0.5 flex items-center">
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            -{scorecard.cvssReduction}
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-slate-400 font-semibold mb-1">REMEDIATION ACTIONS:</div>
        <ul className="space-y-1">
          {scorecard.keyRemediations.map((action, idx) => (
            <li key={idx} className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
