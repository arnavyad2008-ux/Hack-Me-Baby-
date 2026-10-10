import { beforeEach, describe, expect, it } from "vitest";
import { initialArenaData, useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { buildAuditRequest, snapshotFromState } from "@/frontend/services/auditRunner";
import { StreamEventSchema } from "@/shared/contracts/events";
import { getPresetSnippet } from "@/shared/presets/snippets";
import { SQLI_GOOD_PATCH, SQLI_RED } from "./support/fixtures";

const store = () => useCyberArena.getState();
const begin = (runId: string) => store().beginRun(snapshotFromState(store(), runId));
const ev = (runId: string, e: Record<string, unknown>, seq = 0) => store().applyEvent(StreamEventSchema.parse({ runId, seq, ...e }));

const blueResult = { patchedCode: SQLI_GOOD_PATCH, addressedFindingIds: ["F-1"], changes: [], dependencies: [], limitations: [] };

beforeEach(() => useCyberArena.setState(initialArenaData()));

describe("target editing and reset", () => {
  it("editing a preset detaches it and live analysis uses the edited source", () => {
    store().editTargetCode(getPresetSnippet("sql-injection").code + "\n// edited");
    expect(store().target.presetId).toBeNull();
    expect(store().mode).toBe("LIVE");
    const request = buildAuditRequest(snapshotFromState(store(), "run-aaaaaaaa"));
    expect(request.code).toContain("// edited");
    expect(request).not.toHaveProperty("presetId");
  });

  it("demo requests carry the preset identity; demo cannot be selected for custom code", () => {
    expect(buildAuditRequest(snapshotFromState(store(), "run-aaaaaaaa")).presetId).toBe("sql-injection");
    store().editTargetCode("const x = 1;");
    store().setMode("DEMO");
    expect(store().mode).toBe("LIVE");
  });

  it("editing invalidates stale findings, patches and verification", () => {
    begin("run-aaaaaaaa");
    ev("run-aaaaaaaa", { type: "red.result", result: SQLI_RED, illustrative: true });
    ev("run-aaaaaaaa", { type: "run.completed", outcome: "NO_PATCH" });
    store().editTargetCode("const y = 2;");
    expect(store()).toMatchObject({ red: null, blue: null, verification: null, outcome: null, phase: "IDLE", run: null });
  });

  it("reset restores the default preset with consistent identity and code", () => {
    store().loadPreset("ssrf-webhook");
    store().editTargetCode("const z = 3;");
    store().resetArena();
    expect(store().target.presetId).toBe("sql-injection");
    expect(store().target.code).toBe(getPresetSnippet("sql-injection").code);
    expect(store().phase).toBe("IDLE");
  });
});

describe("run lifecycle", () => {
  it("locks target-changing controls during a run and prevents a second concurrent run", () => {
    expect(begin("run-aaaaaaaa")).toBe(true);
    expect(begin("run-bbbbbbbb")).toBe(false);
    store().loadPreset("rce-command");
    store().editTargetCode("changed");
    store().resetArena();
    expect(store().target.presetId).toBe("sql-injection");
  });

  it("ignores late events from an old or cancelled run", () => {
    begin("run-aaaaaaaa");
    store().cancelRun("run-aaaaaaaa");
    expect(store().phase).toBe("CANCELLED");
    ev("run-aaaaaaaa", { type: "red.result", result: SQLI_RED, illustrative: false });
    expect(store().red).toBeNull();

    begin("run-bbbbbbbb");
    ev("run-aaaaaaaa", { type: "run.completed", outcome: "CHECKS_PASSED" });
    expect(store().phase).toBe("RED_ANALYSIS");
  });

  it("restores usable controls after failure and cancellation", () => {
    begin("run-aaaaaaaa");
    store().failRun("run-aaaaaaaa", { code: "PROVIDER_ERROR", message: "HTTP 503", retryable: true });
    expect(store().phase).toBe("FAILED");
    store().loadPreset("rce-command");
    expect(store().target.presetId).toBe("rce-command");
    expect(begin("run-bbbbbbbb")).toBe(true);
  });

  it("a second run does not retain the previous run's results", () => {
    begin("run-aaaaaaaa");
    ev("run-aaaaaaaa", { type: "red.result", result: SQLI_RED, illustrative: false });
    ev("run-aaaaaaaa", { type: "log", agent: "RED", text: "old", illustrative: false });
    ev("run-aaaaaaaa", { type: "run.completed", outcome: "NO_PATCH" });
    begin("run-bbbbbbbb");
    expect(store()).toMatchObject({ red: null, redLogs: [], outcome: null, error: null });
  });

  it("keeps the diff available after completion", () => {
    begin("run-aaaaaaaa");
    ev("run-aaaaaaaa", { type: "phase", phase: "BLUE_PATCH" });
    ev("run-aaaaaaaa", { type: "blue.result", result: blueResult, illustrative: false });
    expect(store().editorView).toBe("DIFF");
    ev("run-aaaaaaaa", { type: "phase", phase: "VERIFYING" });
    ev("run-aaaaaaaa", { type: "run.completed", outcome: "PATCH_PROPOSED" });
    expect(store()).toMatchObject({ phase: "COMPLETED", editorView: "DIFF" });
    expect(store().blue?.patchedCode).toBe(SQLI_GOOD_PATCH);
    expect(store().run?.code).toBe(getPresetSnippet("sql-injection").code);
  });

  it("supports completion with zero findings", () => {
    begin("run-aaaaaaaa");
    ev("run-aaaaaaaa", { type: "red.result", result: { summary: "ok", findings: [], missingContext: [] }, illustrative: false });
    ev("run-aaaaaaaa", { type: "run.completed", outcome: "NO_FINDINGS" });
    expect(store()).toMatchObject({ phase: "COMPLETED", outcome: "NO_FINDINGS" });
  });

  it("fails the run on an out-of-order phase", () => {
    begin("run-aaaaaaaa");
    ev("run-aaaaaaaa", { type: "phase", phase: "VERIFYING" });
    ev("run-aaaaaaaa", { type: "phase", phase: "BLUE_PATCH" });
    expect(store()).toMatchObject({ phase: "FAILED", error: { code: "STREAM_ERROR" } });
  });
});
