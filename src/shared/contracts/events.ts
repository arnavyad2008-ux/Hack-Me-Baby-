import { z } from "zod";
import { BlueResultSchema, RedResultSchema } from "./findings";
import { MAX_SOURCE_CHARS, SUPPORTED_LANGUAGES } from "./limits";
import { OutcomeSchema, VerificationResultSchema } from "./verification";

export const AuditModeSchema = z.enum(["DEMO", "LIVE"]);
export const RunIdSchema = z.string().regex(/^[A-Za-z0-9-]{8,64}$/, "Invalid run ID");

export const AuditRequestSchema = z.object({
  runId: RunIdSchema,
  mode: AuditModeSchema,
  code: z
    .string()
    .min(5, "Code must be at least 5 characters")
    .max(MAX_SOURCE_CHARS, `Code exceeds ${MAX_SOURCE_CHARS} characters`),
  language: z.enum(SUPPORTED_LANGUAGES),
  presetId: z.string().max(64).optional(),
});

export const ErrorCodeSchema = z.enum([
  "CONFIG_MISSING",
  "PROVIDER_ERROR",
  "PROVIDER_TIMEOUT",
  "INVALID_MODEL_OUTPUT",
  "UNSUPPORTED_INPUT",
  "BUSY",
  "STREAM_ERROR",
  "INTERNAL",
]);

export const RunErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string().max(600),
  retryable: z.boolean(),
});

export const PipelinePhaseSchema = z.enum(["RED_ANALYSIS", "BLUE_PATCH", "VERIFYING"]);

const base = { runId: RunIdSchema, seq: z.number().int().nonnegative() };

export const StreamEventSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("run.started"), mode: AuditModeSchema, illustrative: z.boolean() }),
  z.object({ ...base, type: z.literal("phase"), phase: PipelinePhaseSchema }),
  z.object({
    ...base,
    type: z.literal("log"),
    agent: z.enum(["RED", "BLUE", "VERIFIER"]),
    text: z.string().max(2000),
    illustrative: z.boolean(),
  }),
  z.object({ ...base, type: z.literal("red.result"), result: RedResultSchema, illustrative: z.boolean() }),
  z.object({ ...base, type: z.literal("blue.result"), result: BlueResultSchema, illustrative: z.boolean() }),
  z.object({ ...base, type: z.literal("verification.result"), result: VerificationResultSchema }),
  z.object({ ...base, type: z.literal("run.completed"), outcome: OutcomeSchema }),
  z.object({ ...base, type: z.literal("run.error"), error: RunErrorSchema }),
]);

export type AuditMode = z.infer<typeof AuditModeSchema>;
export type AuditRequest = z.infer<typeof AuditRequestSchema>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type RunError = z.infer<typeof RunErrorSchema>;
export type PipelinePhase = z.infer<typeof PipelinePhaseSchema>;
export type StreamEvent = z.infer<typeof StreamEventSchema>;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
/** An event before the stream layer stamps it with runId and sequence number. */
export type StreamEventInput = DistributiveOmit<StreamEvent, "runId" | "seq">;

export function isTerminalEvent(event: StreamEvent): boolean {
  return event.type === "run.completed" || event.type === "run.error";
}
