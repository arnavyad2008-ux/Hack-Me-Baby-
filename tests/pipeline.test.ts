import { describe, expect, it } from "vitest";
import { runLiveAudit, type LiveAuditDeps } from "@/backend/services/auditService";
import { runDemoPlayback } from "@/backend/services/demoPlaybackService";
import { ProviderError } from "@/backend/services/llmProvider";
import { createUnavailableRunner } from "@/backend/verification/isolatedRunner";
import { createEventStream } from "@/backend/sse/streamHandler";
import type { AuditRequest } from "@/shared/contracts/events";
import { getPresetSnippet } from "@/shared/presets/snippets";
import { SQLI_GOOD_PATCH, SQLI_ORIGINAL } from "./support/fixtures";
import { createMockProvider, redJson, sqliFinding } from "./support/mockProvider";
import { collectEvents } from "./support/readStream";
import { createTrustedLocalRunner } from "./support/trustedLocalRunner";

const RUN_ID = "run-12345678";
const liveRequest = (code: string): AuditRequest => ({ runId: RUN_ID, mode: "LIVE", code, language: "typescript" });
const live = (code: string, deps: LiveAuditDeps) =>
  collectEvents(createEventStream(RUN_ID, (emit, signal) => runLiveAudit(liveRequest(code), emit, signal, deps)));

const blueJson = JSON.stringify({
  patchedCode: SQLI_GOOD_PATCH, addressedFindingIds: ["F-1"], changes: ["Bind parameters."], dependencies: [], limitations: [],
});

describe("live pipeline", () => {
  it("audits the exact edited source, not the preset it came from", async () => {
    const edited = SQLI_ORIGINAL.replace("Invalid credentials", "EDITED-MARKER");
    const provider = createMockProvider(() => redJson());
    await live(edited, { getProvider: () => provider, runner: createUnavailableRunner("none") });
    expect(provider.requests[0]?.user).toContain("EDITED-MARKER");
  });

  it("completes with NO_FINDINGS and skips Blue when Red reports nothing", async () => {
    const provider = createMockProvider(() => redJson());
    const events = await live(SQLI_ORIGINAL, { getProvider: () => provider, runner: createUnavailableRunner("none") });
    expect(provider.requests).toHaveLength(1);
    expect(events.at(-1)).toMatchObject({ type: "run.completed", outcome: "NO_FINDINGS" });
    expect(events.every((e) => e.runId === RUN_ID)).toBe(true);
    expect(events.map((e) => e.seq)).toEqual(events.map((_, i) => i));
  });

  it("runs Red → Blue → real verification on the candidate patch", async () => {
    const provider = createMockProvider((_req, call) => (call === 1 ? redJson([sqliFinding]) : blueJson));
    const runner = createTrustedLocalRunner();
    const events = await live(SQLI_ORIGINAL, { getProvider: () => provider, runner });
    const types = events.map((e) => e.type);
    expect(types.indexOf("red.result")).toBeLessThan(types.indexOf("blue.result"));
    expect(runner.calls).toBe(1);
    const verification = events.find((e) => e.type === "verification.result");
    expect(verification).toMatchObject({ result: { scope: "CONTROLLED_FIXTURE", status: "PASSED" } });
    expect(events.at(-1)).toMatchObject({ type: "run.completed", outcome: "CHECKS_PASSED" });
    expect(events.some((e) => "illustrative" in e && e.illustrative)).toBe(false);
  });

  it("reports missing credentials as a configuration error, never demo results", async () => {
    const events = await live(SQLI_ORIGINAL, { getProvider: () => null, runner: createUnavailableRunner("none") });
    expect(events.map((e) => e.type)).toEqual(["run.started", "run.error"]);
    expect(events.at(-1)).toMatchObject({ error: { code: "CONFIG_MISSING" } });
  });

  it("surfaces provider failures and malformed model output as errors", async () => {
    const failing = createMockProvider(() => {
      throw new ProviderError("PROVIDER_ERROR", "HTTP 503", true);
    });
    const failed = await live(SQLI_ORIGINAL, { getProvider: () => failing, runner: createUnavailableRunner("none") });
    expect(failed.at(-1)).toMatchObject({ type: "run.error", error: { code: "PROVIDER_ERROR" } });
    expect(failed.some((e) => e.type === "red.result")).toBe(false);

    const garbage = createMockProvider(() => '{"findings": "lots"}');
    const invalid = await live(SQLI_ORIGINAL, { getProvider: () => garbage, runner: createUnavailableRunner("none") });
    expect(invalid.at(-1)).toMatchObject({ type: "run.error", error: { code: "INVALID_MODEL_OUTPUT" } });
  });
});

describe("demo playback", () => {
  it("marks recorded results illustrative and runs real verification on the recorded patch", async () => {
    const code = getPresetSnippet("sql-injection").code;
    const request: AuditRequest = { runId: RUN_ID, mode: "DEMO", code, language: "typescript", presetId: "sql-injection" };
    const events = await collectEvents(
      createEventStream(RUN_ID, (emit, signal) =>
        runDemoPlayback(request, "sql-injection", emit, signal, { runner: createUnavailableRunner("none"), stepDelayMs: 0 })
      )
    );
    expect(events[0]).toMatchObject({ type: "run.started", mode: "DEMO", illustrative: true });
    expect(events.find((e) => e.type === "red.result")).toMatchObject({ illustrative: true });
    expect(events.find((e) => e.type === "blue.result")).toMatchObject({ illustrative: true });
    expect(events.find((e) => e.type === "verification.result")).toMatchObject({ result: { scope: "STATIC_ONLY" } });
    const red = events.find((e) => e.type === "red.result");
    expect(red?.type === "red.result" && red.result.findings.every((f) => f.evidenceInSource)).toBe(true);
  });
});
