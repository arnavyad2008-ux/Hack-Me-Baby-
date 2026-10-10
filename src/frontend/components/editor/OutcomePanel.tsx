"use client";

import React, { useState } from "react";
import { ClipboardCheck, Copy, Check, Download } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { buildAuditReport } from "@/frontend/services/auditReport";
import { OUTCOME_LABELS, SCOPE_LABELS } from "@/shared/contracts/verification";

export function OutcomePanel() {
  const outcome = useCyberArena((s) => s.outcome);
  const patchedCode = useCyberArena((s) => s.blue?.patchedCode ?? null);
  const verification = useCyberArena((s) => s.verification);
  const illustrative = useCyberArena((s) => s.illustrative);
  const [copied, setCopied] = useState(false);

  if (!outcome) return null;

  const handleCopyPatch = async () => {
    if (!patchedCode) return;
    try {
      await navigator.clipboard.writeText(patchedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadReport = () => {
    const report = buildAuditReport(useCyberArena.getState());
    const url = URL.createObjectURL(new Blob([report], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tone =
    outcome === "CHECKS_PASSED" ? "text-emerald-400" : outcome === "VERIFICATION_FAILED" ? "text-cyber-red" : "text-slate-200";

  return (
    <div className="px-4 py-3 bg-slate-900/95 border-t border-cyber-border font-mono text-xs text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <ClipboardCheck className="w-5 h-5 text-cyber-neon shrink-0" aria-hidden />
          <div className="min-w-0">
            <div className={`font-bold text-sm ${tone}`}>{OUTCOME_LABELS[outcome]}</div>
            <div className="text-[11px] text-slate-400">
              {verification ? SCOPE_LABELS[verification.scope] : "No verification ran"}
              {illustrative && " · findings and patch are recorded demo content"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPatch}
            disabled={!patchedCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] disabled:opacity-40"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" aria-hidden /> : <Copy className="w-3 h-3 text-cyber-blue" aria-hidden />}
            <span>{copied ? "Copied" : "Copy Patch"}</span>
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyber-blue/10 border border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-black transition-all text-[11px]"
          >
            <Download className="w-3 h-3" aria-hidden />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
