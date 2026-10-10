export type ArenaPhase =
  | "IDLE"
  | "TARGET_ACQUIRED"
  | "RED_RECON"
  | "RED_EXPLOIT"
  | "BLUE_INTERCEPT"
  | "BLUE_PATCH"
  | "RESOLVED";

export type VulnerabilitySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface VulnerabilityProfile {
  id: string;
  title: string;
  cve: string;
  cwe: string;
  severity: VulnerabilitySeverity;
  description: string;
  vulnerableLineNumbers: number[];
  vector: string;
  sampleExploitPayload: string;
  remediationSummary: string;
}

export interface SecurityScorecard {
  initialRiskScore: number;
  postPatchRiskScore: number;
  cvssReduction: number;
  defenseGrade: "A+" | "A" | "B" | "C" | "F";
  owaspCategory: string;
  mitigationStatus: "VERIFIED_SECURE" | "PARTIAL_REMEDIATION" | "FAILED";
  keyRemediations: string[];
}

export interface StreamEventPayload {
  phase: ArenaPhase;
  type: "log" | "recon" | "exploit" | "intercept" | "patch" | "scorecard" | "error";
  text: string;
  data?: {
    vulnerability?: VulnerabilityProfile;
    patchedCode?: string;
    scorecard?: SecurityScorecard;
  };
}

export interface PresetSnippet {
  id: string;
  name: string;
  language: string;
  code: string;
  description: string;
  vulnerabilityType: string;
}
