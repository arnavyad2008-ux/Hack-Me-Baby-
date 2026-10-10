import { z } from "zod";
import { MAX_SOURCE_CHARS } from "./limits";

const text = (max: number) => z.string().trim().min(1).max(max);

export const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const SeveritySchema = z.enum(SEVERITIES);
export const ConfidenceSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const FindingIdSchema = z.string().regex(/^F-\d{1,2}$/, "Finding IDs must look like F-1");

export const CodeLocationSchema = z
  .object({
    startLine: z.number().int().min(1),
    endLine: z.number().int().min(1),
  })
  .refine((loc) => loc.endLine >= loc.startLine, "endLine must be >= startLine");

/** Shape the Red model must return for each finding (validated before use). */
export const ModelFindingSchema = z.object({
  id: FindingIdSchema,
  title: text(160),
  cwe: z
    .string()
    .regex(/^CWE-\d{1,5}$/, "CWE must look like CWE-89")
    .nullable(),
  severity: SeveritySchema,
  confidence: ConfidenceSchema,
  explanation: text(2000),
  locations: z.array(CodeLocationSchema).min(1).max(10),
  evidence: z.array(text(500)).min(1).max(5),
  demonstrationInput: z.string().max(500).nullable(),
  assumptions: z.array(text(400)).max(8),
});

export const ModelRedOutputSchema = z.object({
  summary: text(1000),
  findings: z.array(ModelFindingSchema).max(10),
  missingContext: z.array(text(400)).max(8),
});

/** A finding after server-side checks against the submitted source. */
export const FindingSchema = ModelFindingSchema.extend({
  /** True when every evidence excerpt appears verbatim (whitespace-normalised) in the source. */
  evidenceInSource: z.boolean(),
});

export const RedResultSchema = z.object({
  summary: text(1000),
  findings: z.array(FindingSchema).max(10),
  missingContext: z.array(text(400)).max(8),
});

export const ModelBlueOutputSchema = z.object({
  patchedCode: z.string().min(1).max(MAX_SOURCE_CHARS * 2).nullable(),
  addressedFindingIds: z.array(FindingIdSchema).max(10),
  changes: z.array(text(600)).max(12),
  dependencies: z.array(text(300)).max(8),
  limitations: z.array(text(400)).max(8),
});

export const BlueResultSchema = ModelBlueOutputSchema;

export type Severity = z.infer<typeof SeveritySchema>;
export type ModelRedOutput = z.infer<typeof ModelRedOutputSchema>;
export type Finding = z.infer<typeof FindingSchema>;
export type RedResult = z.infer<typeof RedResultSchema>;
export type BlueResult = z.infer<typeof BlueResultSchema>;
