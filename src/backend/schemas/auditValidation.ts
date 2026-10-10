import { z } from "zod";

export const AuditRequestSchema = z.object({
  code: z
    .string()
    .min(5, "Code snippet must be at least 5 characters")
    .max(50000, "Code snippet exceeds max payload size"),
  language: z.string().default("typescript"),
  presetId: z.string().optional(),
  aiMode: z.enum(["HUGGING_FACE", "SIMMY_LOCAL", "STATIC_AST"]).optional(),
});

export type AuditRequestInput = z.infer<typeof AuditRequestSchema>;

export const VulnerabilityProfileSchema = z.object({
  id: z.string(),
  title: z.string(),
  cve: z.string(),
  cwe: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  description: z.string(),
  vulnerableLineNumbers: z.array(z.number()),
  vector: z.string(),
  sampleExploitPayload: z.string(),
  remediationSummary: z.string(),
});

export const SecurityScorecardSchema = z.object({
  initialRiskScore: z.number().min(0).max(10),
  postPatchRiskScore: z.number().min(0).max(10),
  cvssReduction: z.number().min(0).max(10),
  defenseGrade: z.enum(["A+", "A", "B", "C", "F"]),
  owaspCategory: z.string(),
  mitigationStatus: z.enum([
    "VERIFIED_SECURE",
    "PARTIAL_REMEDIATION",
    "FAILED",
  ]),
  keyRemediations: z.array(z.string()),
});
