"use client";

import React from "react";
import Editor from "@monaco-editor/react";
import { useCyberArena } from "@/hooks/useCyberArenaState";
import { Loader2 } from "lucide-react";

export function TargetCodeEditor() {
  const { targetCode, setTargetCode, phase } = useCyberArena();
  const isReadOnly = phase !== "IDLE" && phase !== "TARGET_ACQUIRED";

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        value={targetCode}
        theme="vs-dark"
        onChange={(val) => setTargetCode(val || "")}
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
            <Loader2 className="w-4 h-4 animate-spin text-cyber-blue" />
            INITIALIZING CODE ENVIRONMENT...
          </div>
        }
      />
    </div>
  );
}
