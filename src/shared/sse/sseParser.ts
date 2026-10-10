export interface SseMessage {
  event: string;
  data: string;
}

/**
 * Incremental Server-Sent Events parser (WHATWG event-stream format).
 * Accepts arbitrary byte chunks, so events and multi-byte characters may be split
 * across transport chunks. Comment lines (": ping") are ignored.
 */
export class SseParser {
  private readonly decoder = new TextDecoder();
  private buffer = "";
  private dataLines: string[] = [];
  private eventName = "";

  push(chunk: Uint8Array): SseMessage[] {
    this.buffer += this.decoder.decode(chunk, { stream: true });
    return this.drain(false);
  }

  /** Flushes the decoder at end of stream. Returns any event terminated only by EOF (spec: discarded). */
  end(): SseMessage[] {
    this.buffer += this.decoder.decode();
    const messages = this.drain(true);
    this.dataLines = [];
    this.eventName = "";
    return messages;
  }

  private drain(final: boolean): SseMessage[] {
    const messages: SseMessage[] = [];
    for (;;) {
      const match = /\r\n|\r|\n/.exec(this.buffer);
      if (!match) break;
      // A lone trailing "\r" may be the first half of "\r\n" split across chunks.
      if (match[0] === "\r" && match.index === this.buffer.length - 1 && !final) break;
      const line = this.buffer.slice(0, match.index);
      this.buffer = this.buffer.slice(match.index + match[0].length);
      const message = this.processLine(line);
      if (message) messages.push(message);
    }
    return messages;
  }

  private processLine(line: string): SseMessage | null {
    if (line === "") {
      if (this.dataLines.length === 0) {
        this.eventName = "";
        return null;
      }
      const message = { event: this.eventName || "message", data: this.dataLines.join("\n") };
      this.dataLines = [];
      this.eventName = "";
      return message;
    }
    if (line.startsWith(":")) return null;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "data") this.dataLines.push(value);
    else if (field === "event") this.eventName = value;
    return null;
  }
}

export function encodeSseData(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}
