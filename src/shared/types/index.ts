import type { PipelinePhase } from "@/shared/contracts/events";

export type { AuditMode, StreamEvent, RunError } from "@/shared/contracts/events";
export type { Finding, RedResult, BlueResult, Severity } from "@/shared/contracts/findings";
export type { VerificationResult, Outcome } from "@/shared/contracts/verification";

/** UI lifecycle. Pipeline phases come from the server; the rest are client-side states. */
export type ArenaPhase = "IDLE" | PipelinePhase | "COMPLETED" | "FAILED" | "CANCELLED";

export type EditorViewMode = "CODE" | "DIFF" | "VERIFICATION";

export interface LogLine {
  id: number;
  text: string;
  agent: "RED" | "BLUE" | "VERIFIER" | "CLIENT";
  illustrative: boolean;
  at: number;
}

/** A heuristic lead from repo/URL ingestion — not a confirmed finding. */
export interface ScannedFileReport {
  path: string;
  label: string;
  snippet: string;
  explanation: string;
  /** Present when the snippet is real source that can be loaded into the editor. */
  loadable: boolean;
}

export interface DuelProbeResult {
  available: boolean;
  message: string;
  original?: string;
  candidate?: string;
}
