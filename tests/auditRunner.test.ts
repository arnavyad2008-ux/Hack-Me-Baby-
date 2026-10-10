import { beforeEach, describe, expect, it } from "vitest";
import { initialArenaData, useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { cancelAuditRun, startAuditRun } from "@/frontend/services/auditRunner";
import { sse, sseFetch } from "./support/sseResponse";

const store = () => useCyberArena.getState();
beforeEach(() => useCyberArena.setState(initialArenaData()));

/** Captures the runId the runner generates so the mock stream can answer for that run. */
function fetchForCurrentRun(build: (runId: string) => string[], opts?: { hangAtEnd?: boolean }) {
  return async (url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { runId: string };
    return sseFetch(build(body.runId), opts)(url, init);
  };
}

describe("audit runner", () => {
  it("completes a run from streamed events", async () => {
    await startAuditRun(
      fetchForCurrentRun((runId) => [
        sse({ runId, seq: 0, type: "run.started", mode: "DEMO", illustrative: true }),
        sse({ runId, seq: 1, type: "run.completed", outcome: "NO_FINDINGS" }),
      ])
    );
    expect(store()).toMatchObject({ phase: "COMPLETED", outcome: "NO_FINDINGS", illustrative: true });
  });

  it("shows provider failures as visible errors, never as demo results", async () => {
    await startAuditRun(
      fetchForCurrentRun((runId) => [
        sse({ runId, seq: 0, type: "run.started", mode: "LIVE", illustrative: false }),
        sse({ runId, seq: 1, type: "run.error", error: { code: "PROVIDER_ERROR", message: "HTTP 503", retryable: true } }),
      ])
    );
    expect(store()).toMatchObject({ phase: "FAILED", error: { code: "PROVIDER_ERROR" }, red: null, blue: null });
  });

  it("marks premature end-of-stream as a failure and keeps controls usable", async () => {
    await startAuditRun(fetchForCurrentRun((runId) => [sse({ runId, seq: 0, type: "run.started", mode: "LIVE", illustrative: false })]));
    expect(store()).toMatchObject({ phase: "FAILED", error: { code: "STREAM_ERROR" } });
  });

  it("cancellation restores controls immediately and ignores the aborted stream", async () => {
    const pending = startAuditRun(
      fetchForCurrentRun((runId) => [sse({ runId, seq: 0, type: "run.started", mode: "LIVE", illustrative: false })], { hangAtEnd: true })
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(store().phase).toBe("RED_ANALYSIS");
    cancelAuditRun();
    expect(store().phase).toBe("CANCELLED");
    await pending;
    expect(store().phase).toBe("CANCELLED");
    expect(store().error).toBeNull();
  });

  it("rejects invalid input locally without contacting the server", async () => {
    store().editTargetCode("x");
    let called = false;
    await startAuditRun(async () => {
      called = true;
      return new Response(null);
    });
    expect(called).toBe(false);
    expect(store()).toMatchObject({ phase: "FAILED", error: { code: "UNSUPPORTED_INPUT" } });
  });
});
