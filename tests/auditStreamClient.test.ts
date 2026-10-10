import { describe, expect, it, vi } from "vitest";
import { AuditClientError, streamAudit } from "@/frontend/services/auditStreamClient";
import type { AuditRequest, StreamEvent } from "@/shared/contracts/events";
import { sse, sseFetch } from "./support/sseResponse";

const request: AuditRequest = { runId: "run-11111111", mode: "LIVE", code: "const a = 1;", language: "typescript" };
const started = { runId: request.runId, seq: 0, type: "run.started", mode: "LIVE", illustrative: false };
const completed = { runId: request.runId, seq: 1, type: "run.completed", outcome: "NO_FINDINGS" };

async function run(fetchImpl: typeof fetch) {
  const events: StreamEvent[] = [];
  const error = await streamAudit(request, { signal: new AbortController().signal, onEvent: (e) => events.push(e), fetchImpl }).then(
    () => null,
    (e: unknown) => e
  );
  return { events, error };
}

describe("streamAudit", () => {
  it("delivers validated events even when an event is split across chunks", async () => {
    const raw = sse(started) + sse(completed);
    const { events, error } = await run(sseFetch([raw.slice(0, 17), raw.slice(17, 60), raw.slice(60)]));
    expect(error).toBeNull();
    expect(events.map((e) => e.type)).toEqual(["run.started", "run.completed"]);
  });

  it("detects a stream that ends before a terminal event", async () => {
    const { error } = await run(sseFetch([sse(started)]));
    expect(error).toBeInstanceOf(AuditClientError);
    expect(error instanceof AuditClientError && error.runError.message).toMatch(/closed the stream/);
  });

  it("rejects malformed JSON and schema-invalid events", async () => {
    expect((await run(sseFetch(["data: {not json\n\n"]))).error).toBeInstanceOf(AuditClientError);
    const invalid = { ...completed, outcome: "SYSTEM_SECURED" };
    const { events, error } = await run(sseFetch([sse(started), sse(invalid)]));
    expect(error).toBeInstanceOf(AuditClientError);
    expect(events).toHaveLength(1);
  });

  it("rejects events that belong to another run", async () => {
    const { error } = await run(sseFetch([sse({ ...started, runId: "run-99999999" })]));
    expect(error instanceof AuditClientError && error.runError.message).toMatch(/different run/);
  });

  it("surfaces HTTP errors from the server with their message", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ error: { code: "UNSUPPORTED_INPUT", message: "Demo playback only replays unmodified presets." } }, { status: 400 })
    );
    const { error } = await run(fetchImpl);
    expect(error instanceof AuditClientError && error.runError).toMatchObject({ code: "UNSUPPORTED_INPUT", retryable: false });
  });
});
