import { VulnerabilitySeverity } from "@/types";

export function getSeverityColor(severity: VulnerabilitySeverity): string {
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

export function formatTimestamp(): string {
  const now = new Date();
  return now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
}

export function truncateString(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}
