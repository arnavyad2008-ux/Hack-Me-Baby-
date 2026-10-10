import { NextRequest } from "next/server";
import { RepoScanService } from "@/backend/services/repoScanService";
import { z } from "zod";

const RepoScanSchema = z.object({
  repoUrl: z.string().min(3),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoUrl } = RepoScanSchema.parse(body);

    const files = await RepoScanService.scanRepository(repoUrl);
    return new Response(JSON.stringify({ files }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to scan repo";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
