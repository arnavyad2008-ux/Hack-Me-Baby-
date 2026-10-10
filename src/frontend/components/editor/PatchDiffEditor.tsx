"use client";

import React from "react";
import { DiffEditor } from "@monaco-editor/react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { Loader2 } from "lucide-react";

export function PatchDiffEditor() {
  const { targetCode, patchedCode } = useCyberArena();

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden bg-[#1e1e1e]">
      <DiffEditor
        height="100%"
        language="typescript"
        original={targetCode}
        modified={patchedCode || targetCode}
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
            <Loader2 className="w-4 h-4 animate-spin text-cyber-blue" />
            COMPUTING AST DIFF PATCH...
          </div>
        }
      />
    </div>
  );
}
