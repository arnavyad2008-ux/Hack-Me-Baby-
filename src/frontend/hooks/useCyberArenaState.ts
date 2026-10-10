import { create } from "zustand";
import { DEFAULT_PRESET_ID, getPresetSnippet, type PresetId } from "@/shared/presets/snippets";
import type { ArenaData, ArenaState, TargetState } from "@/frontend/state/arenaTypes";
import { applyStreamEvent, emptyResults, makeLog } from "@/frontend/state/applyStreamEvent";
import { isActivePhase } from "@/frontend/state/phaseMachine";

export type { ArenaState, RunSnapshot, TargetState } from "@/frontend/state/arenaTypes";

function presetTarget(id: PresetId): TargetState {
  const preset = getPresetSnippet(id);
  return { code: preset.code, presetId: id, fileName: `${id}.ts`, language: preset.language };
}

/** Clears everything derived from a previous run. */
const freshTargetState = (target: TargetState): Partial<ArenaData> => ({
  ...emptyResults(),
  target,
  phase: "IDLE",
  run: null,
  editorView: "CODE",
});

export function initialArenaData(): ArenaData {
  return {
    ...emptyResults(),
    mode: "DEMO",
    target: presetTarget(DEFAULT_PRESET_ID),
    phase: "IDLE",
    run: null,
    editorView: "CODE",
    isRepoModalOpen: false,
    soundEnabled: true,
  };
}

export const useCyberArena = create<ArenaState>((set, get) => {
  /** Target-changing actions are refused while a run is active. */
  const whenIdle = (fn: () => void) => {
    if (!isActivePhase(get().phase)) fn();
  };

  return {
    ...initialArenaData(),

    setMode: (mode) =>
      whenIdle(() => {
        if (mode === "DEMO" && get().target.presetId === null) return;
        set({ ...freshTargetState(get().target), mode });
      }),

    editTargetCode: (code) =>
      whenIdle(() => {
        const { target, mode } = get();
        if (code === target.code) return;
        // Edited code is detached from preset playback; demo results no longer apply.
        set({ ...freshTargetState({ ...target, code, presetId: null }), mode: mode === "DEMO" ? "LIVE" : mode });
      }),

    loadExternalTarget: (target) =>
      whenIdle(() => set({ ...freshTargetState({ ...target, presetId: null }), mode: "LIVE" })),

    loadPreset: (presetId) => whenIdle(() => set(freshTargetState(presetTarget(presetId)))),

    resetArena: () => whenIdle(() => set(freshTargetState(presetTarget(DEFAULT_PRESET_ID)))),

    beginRun: (snapshot) => {
      if (isActivePhase(get().phase)) return false;
      set({ ...emptyResults(), run: snapshot, phase: "RED_ANALYSIS", editorView: "CODE", illustrative: snapshot.mode === "DEMO" });
      return true;
    },

    applyEvent: (event) => {
      const patch = applyStreamEvent(get(), event);
      if (patch) set(patch);
    },

    failRun: (runId, error) => {
      const { run, phase } = get();
      if (run?.runId !== runId || !isActivePhase(phase)) return;
      set({ phase: "FAILED", error });
    },

    cancelRun: (runId) => {
      const { run, phase, blueLogs } = get();
      if (run?.runId !== runId || !isActivePhase(phase)) return;
      set({ phase: "CANCELLED", blueLogs: [...blueLogs, makeLog("Run cancelled by user.", "CLIENT", false)] });
    },

    setEditorView: (editorView) => {
      if (editorView === "DIFF" && !get().blue?.patchedCode) return;
      set({ editorView });
    },
    setRepoModalOpen: (isRepoModalOpen) => {
      if (isRepoModalOpen && isActivePhase(get().phase)) return;
      set({ isRepoModalOpen });
    },
    toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  };
});
