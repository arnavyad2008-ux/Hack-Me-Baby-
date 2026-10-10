import type { AuditMode, RunError, StreamEvent } from "@/shared/contracts/events";
import type { BlueResult, RedResult } from "@/shared/contracts/findings";
import type { SupportedLanguage } from "@/shared/contracts/limits";
import type { Outcome, VerificationResult } from "@/shared/contracts/verification";
import type { PresetId } from "@/shared/presets/snippets";
import type { ArenaPhase, EditorViewMode, LogLine } from "@/shared/types";

export interface TargetState {
  code: string;
  /** null once the code is edited or uploaded — it is no longer the preset. */
  presetId: PresetId | null;
  fileName: string;
  language: SupportedLanguage;
}

/** Immutable copy of what a run was started with. */
export interface RunSnapshot extends TargetState {
  runId: string;
  mode: AuditMode;
}

export interface RunResults {
  redLogs: LogLine[];
  blueLogs: LogLine[];
  red: RedResult | null;
  blue: BlueResult | null;
  verification: VerificationResult | null;
  outcome: Outcome | null;
  error: RunError | null;
  illustrative: boolean;
}

export interface ArenaData extends RunResults {
  mode: AuditMode;
  target: TargetState;
  phase: ArenaPhase;
  run: RunSnapshot | null;
  editorView: EditorViewMode;
  isRepoModalOpen: boolean;
  soundEnabled: boolean;
}

export interface ArenaActions {
  setMode: (mode: AuditMode) => void;
  editTargetCode: (code: string) => void;
  loadExternalTarget: (target: Omit<TargetState, "presetId">) => void;
  loadPreset: (presetId: PresetId) => void;
  resetArena: () => void;
  beginRun: (snapshot: RunSnapshot) => boolean;
  applyEvent: (event: StreamEvent) => void;
  failRun: (runId: string, error: RunError) => void;
  cancelRun: (runId: string) => void;
  setEditorView: (view: EditorViewMode) => void;
  setRepoModalOpen: (open: boolean) => void;
  toggleSound: () => void;
}

export type ArenaState = ArenaData & ArenaActions;
