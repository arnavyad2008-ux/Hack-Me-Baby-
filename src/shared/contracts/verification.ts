import { z } from "zod";
import type { BlueResult, RedResult } from "./findings";

export const CheckStatusSchema = z.enum(["PASSED", "FAILED", "SKIPPED", "UNAVAILABLE"]);

export const FixtureCaseSchema = z.object({
  name: z.string().max(120),
  malicious: z.boolean(),
  expected: z.string().max(120),
  original: z.string().max(300),
  candidate: z.string().max(300),
  passed: z.boolean(),
});

export const VerificationCheckSchema = z.object({
  id: z.string().max(40),
  kind: z.enum(["SYNTAX", "TYPECHECK", "STATIC_SQL", "FIXTURE"]),
  label: z.string().max(120),
  status: CheckStatusSchema,
  detail: z.string().max(1500),
  cases: z.array(FixtureCaseSchema).max(20).optional(),
});

/**
 * scope says what kind of evidence backs `status`:
 * - CONTROLLED_FIXTURE: the candidate patch was executed against the SQLi fixture in an isolated runner.
 * - STATIC_ONLY: a fixture exists but only static checks ran (runner unavailable or not applicable).
 * - UNSUPPORTED_CONTEXT: no executable fixture exists for this code; static checks only.
 * - NOT_RUN: nothing was verified (e.g. no patch).
 */
export const VerificationResultSchema = z.object({
  scope: z.enum(["CONTROLLED_FIXTURE", "STATIC_ONLY", "UNSUPPORTED_CONTEXT", "NOT_RUN"]),
  status: z.enum(["PASSED", "FAILED", "UNAVAILABLE", "NOT_RUN"]),
  summary: z.string().max(600),
  checks: z.array(VerificationCheckSchema).max(10),
});

export const OutcomeSchema = z.enum([
  "NO_FINDINGS",
  "NO_PATCH",
  "PATCH_PROPOSED",
  "CHECKS_PASSED",
  "VERIFICATION_FAILED",
]);

export type CheckStatus = z.infer<typeof CheckStatusSchema>;
export type FixtureCase = z.infer<typeof FixtureCaseSchema>;
export type VerificationCheck = z.infer<typeof VerificationCheckSchema>;
export type VerificationResult = z.infer<typeof VerificationResultSchema>;
export type Outcome = z.infer<typeof OutcomeSchema>;

export function deriveOutcome(
  red: RedResult,
  blue: BlueResult | null,
  verification: VerificationResult | null
): Outcome {
  if (red.findings.length === 0) return "NO_FINDINGS";
  if (!blue || blue.patchedCode === null) return "NO_PATCH";
  if (verification?.status === "FAILED") return "VERIFICATION_FAILED";
  if (verification?.status === "PASSED") return "CHECKS_PASSED";
  return "PATCH_PROPOSED";
}

export const OUTCOME_LABELS: Record<Outcome, string> = {
  NO_FINDINGS: "No findings reported (not proof of absence)",
  NO_PATCH: "No patch proposed",
  PATCH_PROPOSED: "Patch proposed — not verified",
  CHECKS_PASSED: "Supported checks passed",
  VERIFICATION_FAILED: "Verification failed",
};

export const SCOPE_LABELS: Record<VerificationResult["scope"], string> = {
  CONTROLLED_FIXTURE: "Controlled fixture execution",
  STATIC_ONLY: "Static checks only (patch not executed)",
  UNSUPPORTED_CONTEXT: "No executable fixture for this code — static checks only",
  NOT_RUN: "Not run",
};
