"use client";

import React, { useRef, useState } from "react";
import { Code2, GitCompare, Award, Upload, Box } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";

export function EditorHeader() {
  const {
    editorView,
    setEditorView,
    patchedCode,
    scorecard,
    setTargetCode,
    setPhase,
  } = useCyberArena();
  const [fileName, setFileName] = useState("target_service.ts");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setTargetCode(content);
        setPhase("TARGET_ACQUIRED");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-10 px-4 bg-slate-900/90 border-b border-cyber-border flex items-center justify-between shrink-0 font-mono text-xs text-slate-300">
      <div className="flex items-center gap-2">
        <Code2 className="w-4 h-4 text-cyber-blue" />
        <span className="font-semibold text-slate-200">{fileName}</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors text-[11px]"
          title="Upload local code file to audit"
        >
          <Upload className="w-3 h-3 text-cyber-blue" />
          <span>Upload File</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ts,.tsx,.js,.jsx,.py,.sql,.java,.go,.cpp,.c"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setEditorView("CODE")}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              editorView === "CODE" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setEditorView("DIFF")}
            disabled={!patchedCode}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              editorView === "DIFF"
                ? "bg-cyber-blue text-black font-bold"
                : "text-slate-400 hover:text-slate-200 disabled:opacity-40"
            }`}
          >
            Diff Patch
          </button>
          <button
            onClick={() => setEditorView("SANDBOX")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
              editorView === "SANDBOX" ? "bg-cyber-red text-black font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Box className="w-3 h-3" />
            <span>Sandbox DAST</span>
          </button>
        </div>

        {scorecard && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500 font-bold ml-1">
            <Award className="w-3.5 h-3.5" />
            {scorecard.defenseGrade}
          </span>
        )}
      </div>
    </div>
  );
}
