import { NextRequest } from "next/server";
import { z } from "zod";
import { scanLiveUrl } from "@/backend/services/liveWebScanService";
import { scanRepository } from "@/backend/services/repoScanService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const IngestScanSchema = z.object({
  url: z.string().trim().min(3).max(500),
  type: z.enum(["REPO", "LIVE_WEB"]).optional(),
});

function looksLikeRepo(url: string): boolean {
  return /^https?:\/\/github\.com\//i.test(url) || /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(url);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const parsed = IngestScanSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Provide a URL or owner/repo." }, { status: 400 });

  const { url, type } = parsed.data;
  const mode = type ?? (looksLikeRepo(url) ? "REPO" : "LIVE_WEB");
  try {
    const files = mode === "LIVE_WEB" ? await scanLiveUrl(url) : await scanRepository(url);
    return Response.json({ files, mode });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to scan target.";
    return Response.json({ error: message }, { status: 400 });
  }
}
