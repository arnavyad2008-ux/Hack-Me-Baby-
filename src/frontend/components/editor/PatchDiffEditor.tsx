"use client";

import React from "react";
import { DiffEditor } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";

/** Original (as submitted for the run) vs. the proposed patch. Persists after the run completes. */
export function PatchDiffEditor() {
  const original = useCyberArena((s) => s.run?.code ?? s.target.code);
  const language = useCyberArena((s) => s.run?.language ?? s.target.language);
  const patched = useCyberArena((s) => s.blue?.patchedCode ?? null);
  const verificationStatus = useCyberArena((s) => s.verification?.status);
  const illustrative = useCyberArena((s) => s.illustrative);

  if (!patched) {
    return <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">No patch proposed for this run.</div>;
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col overflow-hidden bg-[#1e1e1e]">
      <div className="px-3 py-1 text-[11px] font-mono text-slate-400 border-b border-slate-800 flex flex-wrap gap-x-4">
        <span>Left: submitted code</span>
        <span>
          Right: proposed patch{illustrative ? " (recorded demo)" : ""} — verification:{" "}
          <b className="text-slate-200">{verificationStatus ?? "pending"}</b>
        </span>
      </div>
      <div className="flex-1 relative">
        <DiffEditor
          height="100%"
          language={language}
          original={original}
          modified={patched}
          theme="vs-dark"
          options={{
            fontSize: 12,
            minimap: { enabled: false },
            renderSideBySide: true,
            readOnly: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12 },
            fontFamily: "JetBrains Mono, Fira Code, monospace",
          }}
          loading={
            <div className="flex items-center justify-center h-full gap-2 text-slate-500 font-mono text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-cyber-blue" aria-hidden />
              LOADING DIFF...
            </div>
          }
        />
      </div>
    </div>
  );
}
