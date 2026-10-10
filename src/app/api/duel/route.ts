import { NextRequest } from "next/server";
import { z } from "zod";
import { MAX_SOURCE_CHARS, SUPPORTED_LANGUAGES } from "@/shared/contracts/limits";
import { runDuelProbe } from "@/backend/services/duelService";
import { getAuditRuntime } from "@/backend/services/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DuelSchema = z.object({
  original: z.string().min(1).max(MAX_SOURCE_CHARS),
  patched: z.string().min(1).max(MAX_SOURCE_CHARS * 2),
  language: z.enum(SUPPORTED_LANGUAGES),
  username: z.string().max(200),
  password: z.string().max(200),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: { message: "Request body must be JSON." } }, { status: 400 });
  }
  const parsed = DuelSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { message: "Invalid duel request." } }, { status: 400 });
  }
  try {
    const result = await runDuelProbe(parsed.data, getAuditRuntime().runner, req.signal);
    return Response.json(result);
  } catch {
    return Response.json({ error: { message: "Probe failed to run." } }, { status: 500 });
  }
}
