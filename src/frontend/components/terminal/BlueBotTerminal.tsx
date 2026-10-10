"use client";

import React, { useEffect, useRef } from "react";
import { Shield, Wrench, Cpu } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { TerminalHeader } from "./TerminalHeader";
import { TerminalLogLine } from "./TerminalLogLine";

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-1.5">
      <div className="text-[10px] font-bold text-slate-400 uppercase">{title}</div>
      <ul className="list-disc pl-4 text-[11px] text-slate-300">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
    </div>
  );
}

export function BlueBotTerminal() {
  const blueLogs = useCyberArena((s) => s.blueLogs);
  const blue = useCyberArena((s) => s.blue);
  const phase = useCyberArena((s) => s.phase);
  const illustrative = useCyberArena((s) => s.illustrative);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [blueLogs, blue]);

  const status = phase === "BLUE_PATCH" ? "PATCHING" : phase === "VERIFYING" ? "VERIFYING" : blue ? "PROPOSED" : "IDLE";

  return (
    <div className="flex flex-col h-full bg-slate-950/80">
      <TerminalHeader title="BLUE AGENT // PATCH" agentRole="BLUE" statusText={status} icon={<Shield className="w-4 h-4 text-cyber-blue" aria-hidden />} />

      <div className="flex-1 p-3 overflow-y-auto space-y-2 font-mono" aria-live="polite">
        {blueLogs.length === 0 && !blue ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-600 text-xs">
            <Cpu className="w-8 h-8 mb-2 text-slate-700" aria-hidden />
            <span>Blue proposes a patch after Red reports findings.</span>
          </div>
        ) : (
          blueLogs.map((line) => <TerminalLogLine key={line.id} line={line} />)
        )}

        {blue && (
          <div className="mt-3 p-3 rounded border border-cyber-blue/50 bg-cyber-blue-dark/30 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-cyber-blue">
              <Wrench className="w-4 h-4" aria-hidden />
              {blue.patchedCode ? "PATCH PROPOSED — NOT SELF-VERIFIED" : "NO PATCH PROPOSED"}
              {illustrative && <span className="text-[9px] px-1 rounded border border-cyber-warning text-cyber-warning">DEMO</span>}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Addresses: {blue.addressedFindingIds.join(", ") || "none"}
            </div>
            <List title="Changes" items={blue.changes} />
            <List title="Dependencies / assumptions" items={blue.dependencies} />
            <List title="Limitations" items={blue.limitations} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
