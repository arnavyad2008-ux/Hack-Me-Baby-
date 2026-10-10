import { describe, expect, it } from "vitest";
import { createEventStream } from "@/backend/sse/streamHandler";
import { collectEvents } from "./support/readStream";

const RUN_ID = "run-abcdefgh";

describe("server SSE stream", () => {
  it("aborts the pipeline and stops writing when the client cancels", async () => {
    let pipelineSignal: AbortSignal | undefined;
    let emitAfterCancel: (() => void) | undefined;
    const stream = createEventStream(RUN_ID, (emit, signal) => {
      pipelineSignal = signal;
      emit({ type: "run.started", mode: "LIVE", illustrative: false });
      emitAfterCancel = () => emit({ type: "phase", phase: "RED_ANALYSIS" });
      return new Promise((resolve) => signal.addEventListener("abort", () => resolve()));
    });
    const reader = stream.getReader();
    await reader.read();
    await reader.cancel();
    expect(pipelineSignal?.aborted).toBe(true);
    expect(() => emitAfterCancel?.()).not.toThrow();
  });

  it("propagates request disconnects into the pipeline", async () => {
    const request = new AbortController();
    let pipelineSignal: AbortSignal | undefined;
    const stream = createEventStream(
      RUN_ID,
      (_emit, signal) => {
        pipelineSignal = signal;
        return new Promise((resolve) => signal.addEventListener("abort", () => resolve()));
      },
      request.signal
    );
    request.abort();
    expect(pipelineSignal?.aborted).toBe(true);
    await stream.cancel();
  });

  it("emits an error when the pipeline ends without a terminal event", async () => {
    const events = await collectEvents(createEventStream(RUN_ID, async () => undefined));
    expect(events).toEqual([
      { runId: RUN_ID, seq: 0, type: "run.error", error: { code: "INTERNAL", message: "The audit ended without a result.", retryable: true } },
    ]);
  });

  it("ignores emits after the terminal event and rejects invalid events", async () => {
    const events = await collectEvents(
      createEventStream(RUN_ID, async (emit) => {
        emit({ type: "run.completed", outcome: "NO_FINDINGS" });
        emit({ type: "phase", phase: "BLUE_PATCH" });
      })
    );
    expect(events.map((e) => e.type)).toEqual(["run.completed"]);

    const invalid = await collectEvents(
      createEventStream(RUN_ID, async (emit) => {
        emit({ type: "log", agent: "RED", text: "x".repeat(5000), illustrative: false });
      })
    );
    expect(invalid.at(-1)).toMatchObject({ type: "run.error", error: { code: "INTERNAL" } });
  });
});
