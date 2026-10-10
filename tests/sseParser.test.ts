import { describe, expect, it } from "vitest";
import { SseParser } from "@/shared/sse/sseParser";

const encode = (s: string) => new TextEncoder().encode(s);

function parseInChunks(bytes: Uint8Array, size: number) {
  const parser = new SseParser();
  const out = [];
  for (let i = 0; i < bytes.length; i += size) out.push(...parser.push(bytes.slice(i, i + size)));
  out.push(...parser.end());
  return out.map((m) => m.data);
}

describe("SseParser", () => {
  const payload = `data: {"a":"héllo — ✓"}\n\n: ping\n\ndata: {"b":2}\r\n\r\ndata: line1\ndata: line2\n\n`;

  it("produces identical events for every chunk size, including splits inside multi-byte characters and CRLF", () => {
    const bytes = encode(payload);
    const expected = ['{"a":"héllo — ✓"}', '{"b":2}', "line1\nline2"];
    for (let size = 1; size <= bytes.length; size++) {
      expect(parseInChunks(bytes, size)).toEqual(expected);
    }
  });

  it("does not emit an event that was never terminated by a blank line", () => {
    const parser = new SseParser();
    expect(parser.push(encode('data: {"partial":true}'))).toEqual([]);
    expect(parser.end()).toEqual([]);
  });

  it("ignores comments and reads event names", () => {
    const parser = new SseParser();
    expect(parser.push(encode(": keepalive\nevent: custom\ndata: x\n\n"))).toEqual([{ event: "custom", data: "x" }]);
  });
});
