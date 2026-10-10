import { StreamEventSchema, type StreamEvent } from "@/shared/contracts/events";
import { SseParser } from "@/shared/sse/sseParser";

/** Reads an SSE stream to completion and validates every event. */
export async function collectEvents(stream: ReadableStream<Uint8Array>): Promise<StreamEvent[]> {
  const parser = new SseParser();
  const events: StreamEvent[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    for (const msg of parser.push(value)) events.push(StreamEventSchema.parse(JSON.parse(msg.data)));
  }
  return events;
}
