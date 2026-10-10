import { NextRequest } from "next/server";
import { AuditRequestSchema } from "@/lib/schemas/auditSchema";
import { LLMAuditService } from "@/lib/services/llmService";
import { StreamEventPayload } from "@/types";

export const dynamic = "force-dynamic";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = AuditRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: parseResult.error.format() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { code, presetId } = parseResult.data;
    const auditData = await LLMAuditService.executeAudit(code, presetId);

    const stream = new ReadableStream({
      async start(controller) {
        const send = (payload: StreamEventPayload) => {
          const message = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
        };

        // Phase 1: RED_RECON
        for (const log of auditData.redLogs.slice(0, 4)) {
          send({ phase: "RED_RECON", type: "recon", text: log });
          await sleep(650);
        }

        // Phase 2: RED_EXPLOIT
        for (const log of auditData.redLogs.slice(4)) {
          send({ phase: "RED_EXPLOIT", type: "recon", text: log });
          await sleep(500);
        }
        send({
          phase: "RED_EXPLOIT",
          type: "exploit",
          text: `[RED_AGENT] Payload armed: ${auditData.vulnerability.sampleExploitPayload}`,
          data: { vulnerability: auditData.vulnerability },
        });
        await sleep(1000);

        // Phase 3: BLUE_INTERCEPT
        send({
          phase: "BLUE_INTERCEPT",
          type: "intercept",
          text: auditData.blueLogs[0] || "[BLUE_AGENT] Threat intercepted!",
        });
        await sleep(700);

        for (const log of auditData.blueLogs.slice(1, 4)) {
          send({ phase: "BLUE_INTERCEPT", type: "intercept", text: log });
          await sleep(600);
        }

        // Phase 4: BLUE_PATCH
        for (const log of auditData.blueLogs.slice(4)) {
          send({ phase: "BLUE_PATCH", type: "patch", text: log });
          await sleep(550);
        }
        send({
          phase: "BLUE_PATCH",
          type: "patch",
          text: "[BLUE_AGENT] Synthesis complete. Mounting defensive DiffEditor.",
          data: { patchedCode: auditData.patchedCode },
        });
        await sleep(900);

        // Phase 5: RESOLVED
        send({
          phase: "RESOLVED",
          type: "scorecard",
          text: "[BLUE_AGENT] Audit cycle completed. System secured.",
          data: { scorecard: auditData.scorecard },
        });

        controller.close();
      },
    });

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
