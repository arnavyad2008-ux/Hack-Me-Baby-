import { vi } from "vitest";

/** A fetch mock that streams the given raw SSE chunks, optionally pausing until the signal aborts. */
export function sseFetch(chunks: string[], { hangAtEnd = false } = {}) {
  return vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        if (!hangAtEnd) return controller.close();
        init?.signal?.addEventListener("abort", () => controller.error(new DOMException("Aborted", "AbortError")));
      },
    });
    return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
  });
}

export const sse = (event: object) => `data: ${JSON.stringify(event)}\n\n`;
