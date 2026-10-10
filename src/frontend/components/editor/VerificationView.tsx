"use client";

import React from "react";
import { CheckCircle2, XCircle, MinusCircle, HelpCircle, FlaskConical } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { SCOPE_LABELS, type CheckStatus } from "@/shared/contracts/verification";

const STATUS_STYLE: Record<CheckStatus, { icon: React.ReactNode; tone: string }> = {
  PASSED: { icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />, tone: "text-emerald-400 border-emerald-500/40" },
  FAILED: { icon: <XCircle className="w-3.5 h-3.5" aria-hidden />, tone: "text-cyber-red border-cyber-red/50" },
  SKIPPED: { icon: <MinusCircle className="w-3.5 h-3.5" aria-hidden />, tone: "text-slate-400 border-slate-700" },
  UNAVAILABLE: { icon: <HelpCircle className="w-3.5 h-3.5" aria-hidden />, tone: "text-cyber-warning border-cyber-warning/40" },
};

/** Shows exactly which checks ran on the proposed patch and what they observed. */
export function VerificationView() {
  const verification = useCyberArena((s) => s.verification);
  const phase = useCyberArena((s) => s.phase);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/95 font-mono text-xs p-4 overflow-y-auto">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <FlaskConical className="w-4 h-4 text-cyber-blue" aria-hidden />
        <span className="font-bold text-slate-200">PATCH VERIFICATION</span>
      </div>

      {!verification ? (
        <p className="mt-4 text-slate-500">
          {phase === "VERIFYING" ? "Verification is running…" : "No verification yet. It runs after a patch is proposed."}
        </p>
      ) : (
        <div className="space-y-3 mt-4">
          <div className="p-3 rounded border border-slate-800 bg-slate-900/60">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Scope</div>
            <div className="text-slate-200">{SCOPE_LABELS[verification.scope]}</div>
            <div className="mt-1 text-slate-300">{verification.summary}</div>
          </div>
          {verification.checks.map((c) => (
            <div key={c.id} className={`p-3 rounded border bg-slate-900/60 ${STATUS_STYLE[c.status].tone}`}>
              <div className="flex items-center gap-1.5 font-bold">
                {STATUS_STYLE[c.status].icon}
                <span>{c.status}</span>
                <span className="text-slate-200 font-normal">· {c.label}</span>
              </div>
              <div className="mt-1 text-slate-300 break-words">{c.detail}</div>
              {c.cases && c.cases.length > 0 && (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="text-slate-500">
                      <tr><th className="pr-2">Case</th><th className="pr-2">Expected</th><th className="pr-2">Original</th><th>Patched</th></tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {c.cases.map((fc) => (
                        <tr key={fc.name} className="border-t border-slate-800 align-top">
                          <td className="pr-2 py-0.5">{fc.malicious ? "⚠ " : ""}{fc.name}</td>
                          <td className="pr-2 py-0.5">{fc.expected}</td>
                          <td className="pr-2 py-0.5">{fc.original}</td>
                          <td className={`py-0.5 ${fc.passed ? "text-emerald-400" : "text-cyber-red"}`}>{fc.candidate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          <p className="text-[10px] text-slate-500">
            Model statements about its own patch are not counted as verification. Static checks parse and type-check without executing code;
            fixture execution happens only in an isolated container.
          </p>
        </div>
      )}
    </div>
  );
}
