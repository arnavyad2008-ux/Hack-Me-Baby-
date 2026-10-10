"use client";

import React, { useState } from "react";
import { CheckCircle2, Award, ArrowDownRight, Copy, Check, Download } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";

export function ScorecardView() {
  const { scorecard, patchedCode, activeVulnerability } = useCyberArena();
  const [copied, setCopied] = useState(false);

  if (!scorecard) return null;

  const handleCopyPatch = () => {
    if (patchedCode) {
      navigator.clipboard.writeText(patchedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadReport = () => {
    const reportText = `# HACK ME BABY // SECURITY AUDIT REPORT
Target: ${activeVulnerability?.title || "Custom Source"}
CWE: ${activeVulnerability?.cwe || "N/A"}
CVSS Reduction: -${scorecard.cvssReduction}
Defense Grade: ${scorecard.defenseGrade}
Mitigation Status: ${scorecard.mitigationStatus}

## Key Actions Taken:
${scorecard.keyRemediations.map((r) => `- ${r}`).join("\n")}

## Verified Defensive Patch:
\`\`\`typescript
${patchedCode || "// No patch generated"}
\`\`\`
`;
    const blob = new Blob([reportText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-report-${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="p-4 bg-slate-900/95 border-t border-cyber-border font-mono text-xs text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-cyber-neon" />
          <span className="font-bold text-sm text-slate-100">DEFENSE VERIFICATION SCORECARD</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPatch}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyber-blue" />}
            <span>{copied ? "Copied" : "Copy Patch"}</span>
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyber-blue/10 border border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-black transition-all text-[11px]"
          >
            <Download className="w-3 h-3" />
            <span>Export Report</span>
          </button>
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
