import { PresetSnippet, VulnerabilityProfile, SecurityScorecard } from "@/types";

export interface PresetScenario {
  snippet: PresetSnippet;
  vulnerability: VulnerabilityProfile;
  patchedCode: string;
  scorecard: SecurityScorecard;
  redLogs: string[];
  blueLogs: string[];
}
