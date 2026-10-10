import "server-only";
import { StreamEventSchema, type StreamEvent, type StreamEventInput } from "@/shared/contracts/events";
import { encodeSseData } from "@/shared/sse/sseParser";
import { isCancellation, toRunError, type Emit } from "@/backend/services/pipelineSupport";

export type Pipeline = (emit: Emit, signal: AbortSignal) => Promise<void>;

const HEARTBEAT_MS = 15_000;

/**
 * Runs `pipeline` and streams its events as SSE. Every event is validated, stamped
 * with runId/seq, and the stream always ends with exactly one terminal event unless
 * the client disconnected. Client disconnect (or `requestSignal`) aborts the pipeline.
 */
export function createEventStream(runId: string, pipeline: Pipeline, requestSignal?: AbortSignal): ReadableStream<Uint8Array> {
  const abort = new AbortController();
  const encoder = new TextEncoder();
  let closed = false;
  let terminalSent = false;
  let seq = 0;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const onRequestAbort = () => abort.abort();
  requestSignal?.addEventListener("abort", onRequestAbort, { once: true });

  const shutdown = () => {
    closed = true;
    clearInterval(heartbeat);
    requestSignal?.removeEventListener("abort", onRequestAbort);
  };

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (text: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          shutdown();
          abort.abort();
        }
      };
      const emit: Emit = (input: StreamEventInput) => {
        if (closed || terminalSent) return;
        const event: StreamEvent = StreamEventSchema.parse({ ...input, runId, seq: seq++ });
        if (event.type === "run.completed" || event.type === "run.error") terminalSent = true;
        write(encodeSseData(event));
      };
      heartbeat = setInterval(() => write(": ping\n\n"), HEARTBEAT_MS);

      void pipeline(emit, abort.signal)
        .then(() => {
          if (!terminalSent && !abort.signal.aborted) {
            emit({ type: "run.error", error: { code: "INTERNAL", message: "The audit ended without a result.", retryable: true } });
          }
        })
        .catch((err: unknown) => {
          if (!isCancellation(err, abort.signal)) emit({ type: "run.error", error: toRunError(err) });
        })
        .finally(() => {
          if (closed) return;
          shutdown();
          try {
            controller.close();
          } catch {
            // Already closed by a cancelled reader.
          }
        });
    },
    cancel() {
      shutdown();
      abort.abort();
    },
  });
}
