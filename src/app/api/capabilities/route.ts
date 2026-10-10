import { getAuditRuntime } from "@/backend/services/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Reports what the server can do without revealing any credential values. */
export async function GET() {
  try {
    const { env, runner } = getAuditRuntime();
    const availability = await runner.availability();
    return Response.json({
      live: {
        configured: Boolean(env.HF_TOKEN),
        provider: "Hugging Face Inference Providers",
        model: env.HF_MODEL,
      },
      verifier: {
        fixtureExecution: availability.ok,
        detail: availability.ok ? runner.name : availability.reason,
      },
    });
  } catch {
    return Response.json({ error: { code: "INTERNAL", message: "Server configuration is invalid." } }, { status: 500 });
  }
}
