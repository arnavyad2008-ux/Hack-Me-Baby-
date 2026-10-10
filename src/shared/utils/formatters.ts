import type { Severity } from "@/shared/types";

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case "CRITICAL":
      return "text-cyber-red border-cyber-red bg-cyber-red/10";
    case "HIGH":
      return "text-orange-400 border-orange-500 bg-orange-500/10";
    case "MEDIUM":
      return "text-yellow-400 border-yellow-500 bg-yellow-500/10";
    case "LOW":
      return "text-emerald-400 border-emerald-500 bg-emerald-500/10";
    default:
      return "text-slate-400 border-slate-600 bg-slate-800/10";
  }
}
