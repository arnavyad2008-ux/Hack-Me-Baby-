"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import type { Finding } from "@/shared/contracts/findings";
import { getSeverityColor } from "@/shared/utils/formatters";

export function FindingCard({ finding, illustrative }: { finding: Finding; illustrative: boolean }) {
  const lines = finding.locations
    .map((l) => (l.startLine === l.endLine ? `${l.startLine}` : `${l.startLine}–${l.endLine}`))
    .join(", ");

  return (
    <article className="p-3 rounded border border-cyber-red/50 bg-cyber-red-dark/30 text-xs">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-bold text-cyber-red flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden />
          {finding.id} · {finding.cwe ?? "No CWE"}
          {illustrative && <span className="text-[9px] px-1 rounded border border-cyber-warning text-cyber-warning">DEMO</span>}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getSeverityColor(finding.severity)}`}>
          {finding.severity}
        </span>
      </div>
      <div className="font-semibold text-slate-200">{finding.title}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">
        Line {lines} · confidence {finding.confidence}
      </div>
      <p className="mt-1.5 text-slate-300">{finding.explanation}</p>
      <div className="mt-1.5 space-y-1">
        {finding.evidence.map((e, i) => (
          <pre key={i} className="p-1.5 rounded bg-black/60 border border-cyber-red/30 text-[11px] text-slate-200 whitespace-pre-wrap break-all">
            {e}
          </pre>
        ))}
        {!finding.evidenceInSource && (
          <div className="text-[10px] text-cyber-warning">Evidence excerpt was not found verbatim in the source — treat with caution.</div>
        )}
      </div>
      {finding.demonstrationInput && (
        <div className="mt-1.5 text-[11px] text-slate-400">
          Fixture demonstration input: <code className="text-cyber-red break-all">{finding.demonstrationInput}</code>
        </div>
      )}
      {finding.assumptions.length > 0 && (
        <ul className="mt-1.5 text-[10px] text-slate-500 list-disc pl-4">
          {finding.assumptions.map((a, i) => <li key={i}>Assumes: {a}</li>)}
        </ul>
      )}
    </article>
  );
}
