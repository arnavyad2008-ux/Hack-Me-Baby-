import type { ArenaData } from "@/frontend/state/arenaTypes";
import { OUTCOME_LABELS, SCOPE_LABELS } from "@/shared/contracts/verification";

/** Markdown report containing only what the run actually produced. */
export function buildAuditReport(state: Pick<ArenaData, "run" | "red" | "blue" | "verification" | "outcome" | "illustrative">): string {
  const { run, red, blue, verification, outcome, illustrative } = state;
  const lines: string[] = ["# Hack Me Baby — audit report", ""];
  lines.push(`- File: ${run?.fileName ?? "unknown"}`);
  lines.push(`- Mode: ${run?.mode ?? "unknown"}${illustrative ? " (recorded demo playback — illustrative findings and patch)" : ""}`);
  lines.push(`- Outcome: ${outcome ? OUTCOME_LABELS[outcome] : "incomplete"}`);
  if (verification) lines.push(`- Verification: ${verification.status} — ${SCOPE_LABELS[verification.scope]}`);
  lines.push("", "## Findings", "");
  if (!red || red.findings.length === 0) lines.push("No findings reported. This is not proof that the code is free of vulnerabilities.");
  for (const f of red?.findings ?? []) {
    const where = f.locations.map((l) => `${l.startLine}-${l.endLine}`).join(", ");
    lines.push(`### ${f.id}: ${f.title}`, `- ${f.cwe ?? "No CWE"} · ${f.severity} · confidence ${f.confidence} · lines ${where}`);
    lines.push(`- ${f.explanation}`);
    if (!f.evidenceInSource) lines.push("- Note: evidence excerpt not found verbatim in the source.");
    if (f.assumptions.length) lines.push(`- Assumptions: ${f.assumptions.join("; ")}`);
    lines.push("");
  }
  if (red?.missingContext.length) lines.push("Missing context:", ...red.missingContext.map((m) => `- ${m}`), "");
  if (blue) {
    lines.push("## Proposed patch", "", `Addresses: ${blue.addressedFindingIds.join(", ") || "none"}`, "");
    lines.push(...blue.changes.map((c) => `- ${c}`));
    if (blue.dependencies.length) lines.push("", "Dependencies/assumptions:", ...blue.dependencies.map((d) => `- ${d}`));
    if (blue.limitations.length) lines.push("", "Limitations:", ...blue.limitations.map((l) => `- ${l}`));
    if (blue.patchedCode) lines.push("", "```" + (run?.language ?? ""), blue.patchedCode, "```");
  }
  if (verification) {
    lines.push("", "## Verification checks", "");
    lines.push(...verification.checks.map((c) => `- ${c.status} · ${c.label}: ${c.detail}`));
  }
  return lines.join("\n") + "\n";
}
