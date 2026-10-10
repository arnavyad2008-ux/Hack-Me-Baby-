import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  HF_TOKEN: z.string().trim().min(1).optional(),
  HF_MODEL: z.string().trim().min(1).default("Qwen/Qwen2.5-Coder-32B-Instruct"),
  HF_PROVIDER: z.string().trim().min(1).default("auto"),
  LLM_TIMEOUT_MS: z.coerce.number().int().min(5_000).max(120_000).default(45_000),
  LLM_MAX_RETRIES: z.coerce.number().int().min(0).max(3).default(2),
  VERIFIER_RUNTIME: z.enum(["none", "docker"]).default("none"),
  VERIFIER_IMAGE: z.string().trim().min(1).default("node:24-alpine"),
  VERIFIER_TIMEOUT_MS: z.coerce.number().int().min(2_000).max(60_000).default(15_000),
});

export type ServerEnv = z.infer<typeof EnvSchema>;

/** Reads server-only configuration. Empty strings are treated as unset. */
export function readServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value.trim() !== "")
  );
  const parsed = EnvSchema.safeParse(cleaned);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid server configuration: ${fields}`);
  }
  return parsed.data;
}
