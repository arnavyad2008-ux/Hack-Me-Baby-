"use client";

import React from "react";
import type { LogLine } from "@/shared/types";

function formatTime(at: number): string {
  const d = new Date(at);
  return `${d.toTimeString().slice(0, 8)}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export function TerminalLogLine({ line }: { line: LogLine }) {
  const tone =
    line.agent === "VERIFIER"
      ? line.text.startsWith("FAILED")
        ? "text-cyber-red font-semibold"
        : line.text.startsWith("PASSED")
          ? "text-emerald-400"
          : "text-cyber-warning"
      : line.agent === "CLIENT"
        ? "text-slate-400 italic"
        : "text-slate-300";

  return (
    <div className={`font-mono text-xs leading-relaxed flex items-start gap-2 ${tone}`}>
      <span className="text-[10px] text-slate-600 select-none shrink-0">{formatTime(line.at)}</span>
      {line.illustrative && (
        <span className="text-[9px] px-1 rounded border border-cyber-warning/60 text-cyber-warning shrink-0" title="Recorded demo content">
          DEMO
        </span>
      )}
      {line.agent === "VERIFIER" && <span className="text-[9px] px-1 rounded border border-slate-600 text-slate-400 shrink-0">VERIFY</span>}
      <span className="flex-1 break-words">{line.text}</span>
    </div>
  );
}
