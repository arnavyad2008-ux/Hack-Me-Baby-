import "server-only";
import { ModelRedOutputSchema, type RedResult } from "@/shared/contracts/findings";
import type { SupportedLanguage } from "@/shared/contracts/limits";
import { extractJsonObject, frameUntrustedSource, parseModelOutput } from "@/backend/agents/untrustedInput";
import { ProviderError, type LlmProvider } from "@/backend/services/llmProvider";
import { buildRedUserPrompt, RED_BOT_SYSTEM_PROMPT } from "./redBotPrompts";

const normalize = (s: string) => s.replace(/\s+/g, " ").trim();

/** Validates raw model output against the schema and against the actual source. */
export function validateRedOutput(raw: unknown, source: string): RedResult {
  const output = parseModelOutput(ModelRedOutputSchema, raw, "Red agent");
  const lineCount = source.split("\n").length;
  const normalizedSource = normalize(source);
  const ids = new Set<string>();

  const findings = output.findings.map((finding) => {
    if (ids.has(finding.id)) {
      throw new ProviderError("INVALID_MODEL_OUTPUT", `Red agent output repeated finding ID ${finding.id}.`);
    }
    ids.add(finding.id);
    const outOfRange = finding.locations.find((l) => l.endLine > lineCount);
    if (outOfRange) {
      throw new ProviderError(
        "INVALID_MODEL_OUTPUT",
        `Red agent cited line ${outOfRange.endLine} but the source has ${lineCount} lines.`
      );
    }
    const evidenceInSource = finding.evidence.every((e) => normalizedSource.includes(normalize(e)));
    return { ...finding, evidenceInSource };
  });
  return { summary: output.summary, findings, missingContext: output.missingContext };
}

export async function runRedAnalysis(
  provider: LlmProvider,
  source: string,
  language: SupportedLanguage,
  signal: AbortSignal
): Promise<RedResult> {
  const { block } = frameUntrustedSource(source, "SOURCE");
  const text = await provider.complete({
    system: RED_BOT_SYSTEM_PROMPT,
    user: buildRedUserPrompt(block, language, source.split("\n").length),
    maxTokens: 1800,
    signal,
  });
  return validateRedOutput(extractJsonObject(text), source);
}
