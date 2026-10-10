import type { CompletionRequest, LlmProvider } from "@/backend/services/llmProvider";

type Responder = (request: CompletionRequest, call: number) => Promise<string> | string;

export function createMockProvider(responder: Responder): LlmProvider & { requests: CompletionRequest[] } {
  const requests: CompletionRequest[] = [];
  return {
    label: "mock-model",
    requests,
    async complete(request) {
      requests.push(request);
      return responder(request, requests.length);
    },
  };
}

export const redJson = (findings: unknown[] = []) =>
  JSON.stringify({ summary: "Reviewed.", findings, missingContext: [] });

export const sqliFinding = {
  id: "F-1",
  title: "SQL injection",
  cwe: "CWE-89",
  severity: "CRITICAL",
  confidence: "HIGH",
  explanation: "Concatenated SQL reaches db.raw.",
  locations: [{ startLine: 5, endLine: 6 }],
  evidence: ["const user = await db.raw(query);"],
  demonstrationInput: "' OR '1'='1' --",
  assumptions: [],
};
