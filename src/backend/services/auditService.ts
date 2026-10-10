import "server-only";
import type { AuditRequest } from "@/shared/contracts/events";
import { MAX_SOURCE_LINES } from "@/shared/contracts/limits";
import { runBluePatch } from "@/backend/agents/blueTeam/blueAgent";
import { runRedAnalysis } from "@/backend/agents/redTeam/redAgent";
import type { IsolatedRunner } from "@/backend/verification/isolatedRunner";
import { ProviderError, type LlmProvider } from "./llmProvider";
import { verifyAndComplete, type Emit } from "./pipelineSupport";

export interface LiveAuditDeps {
  /** Returns null when no provider credentials are configured. */
  getProvider: () => LlmProvider | null;
  runner: IsolatedRunner;
}

/** Live mode: real model calls on the exact submitted source. Never falls back to demo data. */
export async function runLiveAudit(request: AuditRequest, emit: Emit, signal: AbortSignal, deps: LiveAuditDeps) {
  const source = request.code;
  const { language } = request;
  emit({ type: "run.started", mode: "LIVE", illustrative: false });

  const provider = deps.getProvider();
  if (!provider) {
    throw new ProviderError(
      "CONFIG_MISSING",
      "Live mode needs HF_TOKEN configured on the server (see .env.example). Demo mode works without credentials."
    );
  }
  const lineCount = source.split("\n").length;
  if (lineCount > MAX_SOURCE_LINES) {
    emit({
      type: "run.error",
      error: { code: "UNSUPPORTED_INPUT", message: `Live analysis supports up to ${MAX_SOURCE_LINES} lines per file.`, retryable: false },
    });
    return;
  }

  emit({ type: "phase", phase: "RED_ANALYSIS" });
  emit({ type: "log", agent: "RED", illustrative: false, text: `Sending ${lineCount} lines of ${language} to ${provider.label}.` });
  const red = await runRedAnalysis(provider, source, language, signal);
  emit({ type: "log", agent: "RED", illustrative: false, text: `Model output passed validation: ${red.findings.length} finding(s).` });
  for (const f of red.findings) {
    const lines = f.locations.map((l) => (l.startLine === l.endLine ? `${l.startLine}` : `${l.startLine}-${l.endLine}`)).join(", ");
    const note = f.evidenceInSource ? "" : " (evidence excerpt not found verbatim in source)";
    emit({ type: "log", agent: "RED", illustrative: false, text: `${f.id} ${f.cwe ?? "no CWE"} ${f.severity}/${f.confidence} confidence at line ${lines}${note}` });
  }
  emit({ type: "red.result", result: red, illustrative: false });

  if (red.findings.length === 0) {
    emit({ type: "log", agent: "BLUE", illustrative: false, text: "No findings reported, so no patch was requested." });
    emit({ type: "run.completed", outcome: "NO_FINDINGS" });
    return;
  }

  emit({ type: "phase", phase: "BLUE_PATCH" });
  const ids = red.findings.map((f) => f.id).join(", ");
  emit({ type: "log", agent: "BLUE", illustrative: false, text: `Requesting a minimal patch for ${ids} from ${provider.label}.` });
  const blue = await runBluePatch(provider, source, red, language, signal);
  emit({
    type: "log",
    agent: "BLUE",
    illustrative: false,
    text: blue.patchedCode
      ? `Patch proposed for ${blue.addressedFindingIds.join(", ") || "no listed findings"}. Not yet verified.`
      : "The model did not propose a patch.",
  });
  emit({ type: "blue.result", result: blue, illustrative: false });

  await verifyAndComplete({ emit, signal, runner: deps.runner, source, language, red, blue });
}
