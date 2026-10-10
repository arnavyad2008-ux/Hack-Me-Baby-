import { NextRequest } from "next/server";
import { RepoScanService } from "@/backend/services/repoScanService";
import { LiveWebScanService } from "@/backend/services/liveWebScanService";
import { z } from "zod";

const IngestScanSchema = z.object({
  url: z.string().min(3),
  type: z.enum(["REPO", "LIVE_WEB"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, type } = IngestScanSchema.parse(body);

    const isLiveWeb =
      type === "LIVE_WEB" ||
      (!url.includes("github.com") && !url.match(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/));

    const files = isLiveWeb
      ? await LiveWebScanService.scanLiveUrl(url)
      : await RepoScanService.scanRepository(url);

    return new Response(JSON.stringify({ files, mode: isLiveWeb ? "LIVE_WEB" : "REPO" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to scan target";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
