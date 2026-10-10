import { NextRequest } from "next/server";
import { AuditRequestSchema } from "@/backend/schemas/auditValidation";
import { AuditService } from "@/backend/services/auditService";
import { createAuditSSEStream } from "@/backend/sse/streamHandler";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = AuditRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: parseResult.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { code, presetId, aiMode } = parseResult.data;
    const auditData = await AuditService.executeAudit(code, presetId, aiMode);
    const stream = createAuditSSEStream(auditData);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
