import "server-only";
import { ModelBlueOutputSchema, type BlueResult, type RedResult } from "@/shared/contracts/findings";
import type { SupportedLanguage } from "@/shared/contracts/limits";
import { extractJsonObject, frameUntrustedSource, parseModelOutput } from "@/backend/agents/untrustedInput";
import { ProviderError, type LlmProvider } from "@/backend/services/llmProvider";
import { BLUE_BOT_SYSTEM_PROMPT, buildBlueUserPrompt } from "./blueBotPrompts";

/** Validates Blue output and checks it against the Red findings and original source. */
export function validateBlueOutput(raw: unknown, red: RedResult, source: string): BlueResult {
  const output = parseModelOutput(ModelBlueOutputSchema, raw, "Blue agent");
  const known = new Set(red.findings.map((f) => f.id));
  const unknown = output.addressedFindingIds.filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new ProviderError("INVALID_MODEL_OUTPUT", `Blue agent referenced unknown findings: ${unknown.join(", ")}.`);
  }
  // Models sometimes wrap code in markdown fences inside the JSON string.
  const patched = output.patchedCode?.replace(/^```[a-z]*\n([\s\S]*?)\n```\s*$/i, "$1") ?? null;
  if (patched !== null && patched.trim() === source.trim()) {
    return {
      ...output,
      patchedCode: null,
      addressedFindingIds: [],
      limitations: [...output.limitations, "The model returned the original code unchanged."].slice(0, 8),
    };
  }
  if (patched === null && output.addressedFindingIds.length > 0) {
    return { ...output, addressedFindingIds: [] };
  }
  return { ...output, patchedCode: patched };
}

export async function runBluePatch(
  provider: LlmProvider,
  source: string,
  red: RedResult,
  language: SupportedLanguage,
  signal: AbortSignal
): Promise<BlueResult> {
  const { block } = frameUntrustedSource(source, "SOURCE");
  const findingsJson = JSON.stringify(
    red.findings.map(({ id, title, cwe, severity, explanation, locations, evidence }) => ({
      id, title, cwe, severity, explanation, locations, evidence,
    })),
    null,
    2
  );
  const text = await provider.complete({
    system: BLUE_BOT_SYSTEM_PROMPT,
    user: buildBlueUserPrompt(block, findingsJson, language),
    maxTokens: 3000,
    signal,
  });
  return validateBlueOutput(extractJsonObject(text), red, source);
}
