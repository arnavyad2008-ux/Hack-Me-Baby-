"use client";

import React, { useState } from "react";
import { Globe, GitBranch, Search, Loader2, X, ArrowRight, ShieldCheck } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { ScannedFileReport } from "@/shared/types";
import { getSeverityColor } from "@/shared/utils/formatters";

export function RepoIngestModal() {
  const { isRepoModalOpen, setRepoModalOpen, setTargetCode, setPhase } = useCyberArena();
  const [targetUrl, setTargetUrl] = useState("https://my-dummy-site.vercel.app");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<ScannedFileReport[]>([]);
  const [scanMode, setScanMode] = useState<"LIVE_WEB" | "REPO">("LIVE_WEB");
  const [error, setError] = useState<string | null>(null);

  if (!isRepoModalOpen) return null;

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/repo-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setFiles(data.files || []);
      setScanMode(data.mode || "LIVE_WEB");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error scanning target");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = (file: ScannedFileReport) => {
    setTargetCode(file.snippet);
    setPhase("TARGET_ACQUIRED");
    setRepoModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="w-full max-w-2xl bg-cyber-panel border border-cyber-border rounded-lg shadow-2xl p-5 text-xs text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
            <Globe className="w-4 h-4 text-cyber-blue" />
            <span>INGEST TARGET (LIVE WEB URL OR GITHUB REPO)</span>
          </div>
          <button onClick={() => setRepoModalOpen(false)} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 text-[11px] text-slate-400">
          Paste any live website URL (e.g. <span className="text-cyber-blue">https://my-dummy-site.com</span>) to audit HTTP headers, CORS, and endpoint attack surfaces, or a GitHub repo (e.g. <span className="text-cyber-blue">owner/repo</span>).
        </div>

        <div className="my-3 flex gap-2">
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://your-dummy-site.com or owner/repo"
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyber-blue"
          />
          <button
            onClick={handleScan}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyber-blue text-black font-bold rounded hover:bg-cyber-blue-glow transition-all"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>AUDIT TARGET</span>
          </button>
        </div>

        {error && <div className="text-cyber-red p-2 bg-cyber-red/10 rounded mb-3">{error}</div>}

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {files.map((file, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectFile(file)}
              className="p-2.5 rounded border border-slate-800 bg-slate-900/60 hover:border-cyber-blue transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{file.path}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded border ${getSeverityColor(file.severity)}`}>
                    {file.severity} // {file.cwe}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{file.explanation}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyber-blue transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
