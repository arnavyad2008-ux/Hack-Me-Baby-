"use client";

import React from "react";
import Editor from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { isActivePhase } from "@/frontend/state/phaseMachine";

export function TargetCodeEditor() {
  const code = useCyberArena((s) => s.target.code);
  const language = useCyberArena((s) => s.target.language);
  const editTargetCode = useCyberArena((s) => s.editTargetCode);
  const isReadOnly = useCyberArena((s) => isActivePhase(s.phase));

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden bg-[#1e1e1e]">
      <Editor
        height="100%"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={(val) => editTargetCode(val ?? "")}
        options={{
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly: isReadOnly,
          padding: { top: 12 },
          fontFamily: "JetBrains Mono, Fira Code, monospace",
          renderLineHighlight: "all",
        }}
        loading={
          <div className="flex items-center justify-center h-full gap-2 text-slate-500 font-mono text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-cyber-blue" aria-hidden />
            LOADING EDITOR...
          </div>
        }
      />
    </div>
  );
}
