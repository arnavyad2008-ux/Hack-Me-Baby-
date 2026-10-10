import { z } from "zod";
import {
  ErrorCodeSchema,
  isTerminalEvent,
  StreamEventSchema,
  type AuditRequest,
  type RunError,
  type StreamEvent,
} from "@/shared/contracts/events";
import { SseParser } from "@/shared/sse/sseParser";

export class AuditClientError extends Error {
  constructor(readonly runError: RunError) {
    super(runError.message);
    this.name = "AuditClientError";
  }
}

const streamError = (message: string) => new AuditClientError({ code: "STREAM_ERROR", message, retryable: true });

const ErrorBodySchema = z.object({
  error: z.object({ code: ErrorCodeSchema.optional(), message: z.string().max(600) }),
});

async function errorFromResponse(res: Response): Promise<AuditClientError> {
  const parsed = ErrorBodySchema.safeParse(await res.json().catch(() => null));
  if (parsed.success) {
    const { code = "STREAM_ERROR", message } = parsed.data.error;
    return new AuditClientError({ code, message, retryable: res.status === 429 || res.status >= 500 });
  }
  return streamError(`The audit request failed (HTTP ${res.status}).`);
}

interface StreamOptions {
  signal: AbortSignal;
  onEvent: (event: StreamEvent) => void;
  fetchImpl?: typeof fetch;
}

/**
 * POSTs an audit request and delivers validated events until a terminal event.
 * Throws AuditClientError for HTTP errors, malformed/foreign events, or a stream
 * that ends before completion; rethrows AbortError on cancellation.
 */
export async function streamAudit(request: AuditRequest, { signal, onEvent, fetchImpl = fetch }: StreamOptions): Promise<void> {
  const res = await fetchImpl("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });
  if (!res.ok) throw await errorFromResponse(res);
  if (!res.body) throw streamError("The server returned no event stream.");

  const reader = res.body.getReader();
  const parser = new SseParser();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      const messages = done ? parser.end() : parser.push(value);
      for (const message of messages) {
        let json: unknown;
        try {
          json = JSON.parse(message.data);
        } catch {
          throw streamError("Received a malformed event from the server.");
        }
        const parsed = StreamEventSchema.safeParse(json);
        if (!parsed.success) throw streamError("Received an event that failed validation.");
        if (parsed.data.runId !== request.runId) throw streamError("Received an event for a different run.");
        onEvent(parsed.data);
        if (isTerminalEvent(parsed.data)) return;
      }
      if (done) throw streamError("The server closed the stream before the audit finished.");
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}
