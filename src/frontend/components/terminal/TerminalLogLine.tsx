"use client";

import React from "react";
import { formatTimestamp } from "@/shared/utils/formatters";

interface TerminalLogLineProps {
  log: string;
  isRed: boolean;
}

export function TerminalLogLine({ log, isRed }: TerminalLogLineProps) {
  const isAlert =
    log.includes("[!]") || log.includes("[ALERT]") || log.includes("CRITICAL");
  const isSuccess =
    log.includes("[SUCCESS]") || log.includes("[DEFENSE VERIFIED]");

  let textColor = isRed ? "text-slate-300" : "text-slate-300";
  if (isAlert) textColor = "text-cyber-red font-semibold";
  if (isSuccess) textColor = "text-emerald-400 font-semibold";

  return (
    <div className={`font-mono text-xs leading-relaxed flex items-start gap-2 ${textColor}`}>
      <span className="text-[10px] text-slate-600 select-none">
        {formatTimestamp()}
      </span>
      <span className="flex-1 break-words">{log}</span>
    </div>
  );
}
