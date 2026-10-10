import { NextRequest } from "next/server";
import { DuelService } from "@/backend/services/duelService";
import { z } from "zod";

const DuelSchema = z.object({
  targetCode: z.string(),
  patchedCode: z.string().nullable(),
  customPayload: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetCode, patchedCode, customPayload } = DuelSchema.parse(body);

    const result = DuelService.evaluatePayload(targetCode, patchedCode, customPayload);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Duel evaluation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
