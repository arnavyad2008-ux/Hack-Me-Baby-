import { NextRequest } from "next/server";
import { AuditRequestSchema, type ErrorCode } from "@/shared/contracts/events";
import { MAX_REQUEST_BYTES } from "@/shared/contracts/limits";
import { getPresetSnippet, isPresetId } from "@/shared/presets/snippets";
import { runLiveAudit } from "@/backend/services/auditService";
import { runDemoPlayback } from "@/backend/services/demoPlaybackService";
import { acquireLiveSlot, getAuditRuntime } from "@/backend/services/runtime";
import { createEventStream, type Pipeline } from "@/backend/sse/streamHandler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(status: number, code: ErrorCode, message: string) {
  return Response.json({ error: { code, message, retryable: false } }, { status });
}

export async function POST(req: NextRequest) {
  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_REQUEST_BYTES) {
    return jsonError(413, "UNSUPPORTED_INPUT", "Request body is too large.");
  }
  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > MAX_REQUEST_BYTES) return jsonError(413, "UNSUPPORTED_INPUT", "Request body is too large.");
    body = JSON.parse(raw);
  } catch {
    return jsonError(400, "UNSUPPORTED_INPUT", "Request body must be JSON.");
  }

  const parsed = AuditRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return jsonError(400, "UNSUPPORTED_INPUT", `${issue?.path.join(".") || "request"}: ${issue?.message ?? "invalid"}`);
  }
  const request = parsed.data;
  const runtime = getAuditRuntime();
  let pipeline: Pipeline;
  let release: (() => void) | null = null;

  if (request.mode === "DEMO") {
    const presetId = request.presetId;
    if (!presetId || !isPresetId(presetId) || getPresetSnippet(presetId).code !== request.code) {
      return jsonError(400, "UNSUPPORTED_INPUT", "Demo playback only replays unmodified presets. Use Live mode for edited or uploaded code.");
    }
    pipeline = (emit, signal) => runDemoPlayback(request, presetId, emit, signal, { runner: runtime.runner, stepDelayMs: 450 });
  } else {
    release = acquireLiveSlot();
    if (!release) return jsonError(429, "BUSY", "Too many live audits are running. Try again shortly.");
    const done = release;
    pipeline = (emit, signal) =>
      runLiveAudit(request, emit, signal, { getProvider: runtime.getProvider, runner: runtime.runner }).finally(done);
  }

  return new Response(createEventStream(request.runId, pipeline, req.signal), {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
