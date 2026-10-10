"use client";

import React, { useState } from "react";
import { z } from "zod";
import { Globe, Search, Loader2, X, ArrowRight } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { languageForFileName } from "@/shared/contracts/limits";
import type { ScannedFileReport } from "@/shared/types";

const ScanResponseSchema = z.object({
  files: z.array(z.object({
    path: z.string(), label: z.string(), snippet: z.string(), explanation: z.string(), loadable: z.boolean(),
  })),
  mode: z.enum(["REPO", "LIVE_WEB"]),
});

export function RepoIngestModal() {
  const isOpen = useCyberArena((s) => s.isRepoModalOpen);
  const setRepoModalOpen = useCyberArena((s) => s.setRepoModalOpen);
  const loadExternalTarget = useCyberArena((s) => s.loadExternalTarget);
  const [targetUrl, setTargetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<ScannedFileReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    setFiles([]);
    try {
      const res = await fetch("/api/repo-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const json: unknown = await res.json();
      const parsed = ScanResponseSchema.safeParse(json);
      if (!res.ok || !parsed.success) {
        const message = z.object({ error: z.string() }).safeParse(json);
        throw new Error(message.success ? message.data.error : "Scan failed.");
      }
      setFiles(parsed.data.files);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error scanning target.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = (file: ScannedFileReport) => {
    const language = languageForFileName(file.path);
    if (!file.loadable || !language) return;
    loadExternalTarget({ code: file.snippet, fileName: file.path.split("/").pop() ?? file.path, language });
    setRepoModalOpen(false);
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="ingest-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="w-full max-w-2xl bg-cyber-panel border border-cyber-border rounded-lg shadow-2xl p-5 text-xs text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div id="ingest-title" className="flex items-center gap-2 font-bold text-sm text-slate-100">
            <Globe className="w-4 h-4 text-cyber-blue" aria-hidden />
            <span>INGEST: GITHUB FILE OR URL HEADER CHECK</span>
          </div>
          <button onClick={() => setRepoModalOpen(false)} aria-label="Close" className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-[11px] text-slate-400">
          <b className="text-slate-300">owner/repo</b> lists up to 8 TS/JS files from a public GitHub repo — pick one to load it for a Live audit.
          A <b className="text-slate-300">URL</b> runs a narrow response-header check (public hosts only). Neither is a vulnerability verdict.
        </p>

        <form className="my-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void handleScan(); }}>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="owner/repo or https://example.com"
            aria-label="Repository or URL"
            className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyber-blue"
          />
          <button
            type="submit"
            disabled={loading || targetUrl.trim().length < 3}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyber-blue text-black font-bold rounded hover:bg-cyber-blue-glow transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Search className="w-3.5 h-3.5" aria-hidden />}
            <span>SCAN</span>
          </button>
        </form>

        {error && <div role="alert" className="text-cyber-red p-2 bg-cyber-red/10 rounded mb-3">{error}</div>}

        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {files.map((file, idx) => (
            <li key={`${file.path}-${idx}`}>
              <button
                onClick={() => handleSelectFile(file)}
                disabled={!file.loadable}
                className="w-full text-left p-2.5 rounded border border-slate-800 bg-slate-900/60 enabled:hover:border-cyber-blue transition-all flex items-center justify-between gap-2 group disabled:cursor-default"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-200 break-all">{file.path}</span>
                    <span className="text-[10px] px-1.5 rounded border border-slate-600 text-slate-300">{file.label}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{file.explanation}</div>
                </div>
                {file.loadable && <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyber-blue shrink-0" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
