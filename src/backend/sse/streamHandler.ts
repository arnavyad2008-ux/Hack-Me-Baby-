import { StreamEventPayload } from "@/shared/types";
import { AuditExecutionResult } from "@/backend/services/auditService";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createAuditSSEStream(auditData: AuditExecutionResult): ReadableStream {
  return new ReadableStream({
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
}
