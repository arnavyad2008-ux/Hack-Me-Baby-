"use client";

import React, { useRef, useState } from "react";
import { Code2, Upload, FlaskConical } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { readSourceFile } from "@/frontend/services/readSourceFile";
import { isActivePhase } from "@/frontend/state/phaseMachine";
import { SUPPORTED_UPLOAD_ACCEPT } from "@/shared/contracts/limits";
import type { EditorViewMode } from "@/shared/types";

const TABS: Array<{ view: EditorViewMode; label: string }> = [
  { view: "CODE", label: "Code" },
  { view: "DIFF", label: "Diff (proposed patch)" },
  { view: "VERIFICATION", label: "Verification" },
];

export function EditorHeader() {
  const editorView = useCyberArena((s) => s.editorView);
  const setEditorView = useCyberArena((s) => s.setEditorView);
  const hasPatch = useCyberArena((s) => Boolean(s.blue?.patchedCode));
  const fileName = useCyberArena((s) => s.target.fileName);
  const detached = useCyberArena((s) => s.target.presetId === null);
  const running = useCyberArena((s) => isActivePhase(s.phase));
  const loadExternalTarget = useCyberArena((s) => s.loadExternalTarget);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const result = await readSourceFile(file);
    if (!result.ok) {
      setUploadError(result.message);
      return;
    }
    setUploadError(null);
    loadExternalTarget({ code: result.code, fileName: result.fileName, language: result.language });
  };

  return (
    <div className="px-4 py-1.5 bg-slate-900/90 border-b border-cyber-border flex flex-wrap items-center justify-between gap-2 shrink-0 font-mono text-xs text-slate-300">
      <div className="flex items-center gap-2 min-w-0">
        <Code2 className="w-4 h-4 text-cyber-blue shrink-0" aria-hidden />
        <span className="font-semibold text-slate-200 truncate">{fileName}</span>
        {detached && <span className="text-[10px] px-1.5 rounded border border-slate-600 text-slate-400">custom</span>}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={running}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors text-[11px] disabled:opacity-40"
          title="Upload a TypeScript/JavaScript file to audit in Live mode"
        >
          <Upload className="w-3 h-3 text-cyber-blue" aria-hidden />
          <span>Upload File</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_UPLOAD_ACCEPT}
          onChange={handleFileUpload}
          className="hidden"
          aria-label="Upload source file"
        />
        {uploadError && <span role="alert" className="text-cyber-red text-[11px]">{uploadError}</span>}
      </div>

      <div role="tablist" aria-label="Editor view" className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.view}
            role="tab"
            aria-selected={editorView === tab.view}
            onClick={() => setEditorView(tab.view)}
            disabled={tab.view === "DIFF" && !hasPatch}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors disabled:opacity-40 ${
              editorView === tab.view ? "bg-cyber-blue text-black font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.view === "VERIFICATION" && <FlaskConical className="w-3 h-3" aria-hidden />}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
