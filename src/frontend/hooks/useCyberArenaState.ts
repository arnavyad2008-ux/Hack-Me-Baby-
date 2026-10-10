import { create } from "zustand";
import { ArenaPhase, VulnerabilityProfile, SecurityScorecard } from "@/shared/types";
import {
  getPresetById,
  DEFAULT_PRESET_ID,
} from "@/backend/agents/scenarios/vulnerabilityDatabase";

export interface ArenaState {
  phase: ArenaPhase;
  targetCode: string;
  patchedCode: string | null;
  redBotStream: string[];
  blueBotStream: string[];
  activeVulnerability: VulnerabilityProfile | null;
  scorecard: SecurityScorecard | null;
  activePresetId: string;
  isDiffView: boolean;
  soundEnabled: boolean;
  setPhase: (phase: ArenaPhase) => void;
  setTargetCode: (code: string) => void;
  setPatchedCode: (code: string | null) => void;
  appendRedStream: (chunk: string) => void;
  appendBlueStream: (chunk: string) => void;
  setActiveVulnerability: (vuln: VulnerabilityProfile | null) => void;
  setScorecard: (scorecard: SecurityScorecard | null) => void;
  loadPreset: (presetId: string) => void;
  toggleDiffView: () => void;
  toggleSound: () => void;
  resetArena: () => void;
}

const defaultPreset = getPresetById(DEFAULT_PRESET_ID);

export const useCyberArena = create<ArenaState>((set) => ({
  phase: "IDLE",
  targetCode: defaultPreset.snippet.code,
  patchedCode: null,
  redBotStream: [],
  blueBotStream: [],
  activeVulnerability: null,
  scorecard: null,
  activePresetId: DEFAULT_PRESET_ID,
  isDiffView: false,
  soundEnabled: true,

  setPhase: (phase) => set({ phase }),
  setTargetCode: (code) => set({ targetCode: code }),
  setPatchedCode: (patchedCode) => set({ patchedCode }),
  appendRedStream: (chunk) =>
    set((state) => ({ redBotStream: [...state.redBotStream, chunk] })),
  appendBlueStream: (chunk) =>
    set((state) => ({ blueBotStream: [...state.blueBotStream, chunk] })),
  setActiveVulnerability: (activeVulnerability) =>
    set({ activeVulnerability }),
  setScorecard: (scorecard) => set({ scorecard }),

  loadPreset: (presetId) => {
    const preset = getPresetById(presetId);
    set({
      activePresetId: presetId,
      targetCode: preset.snippet.code,
      patchedCode: null,
      redBotStream: [],
      blueBotStream: [],
      activeVulnerability: null,
      scorecard: null,
      phase: "TARGET_ACQUIRED",
      isDiffView: false,
    });
  },

  toggleDiffView: () => set((state) => ({ isDiffView: !state.isDiffView })),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  resetArena: () => {
    const preset = getPresetById(DEFAULT_PRESET_ID);
    set({
      phase: "IDLE",
      targetCode: preset.snippet.code,
      patchedCode: null,
      redBotStream: [],
      blueBotStream: [],
      activeVulnerability: null,
      scorecard: null,
      isDiffView: false,
    });
  },
}));
