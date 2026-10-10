import { z } from "zod";
import type { DuelProbeResult } from "@/shared/types";
import type { SupportedLanguage } from "@/shared/contracts/limits";

const DuelResponseSchema = z.object({
  available: z.boolean(),
  message: z.string().max(600),
  original: z.string().max(300).optional(),
  candidate: z.string().max(300).optional(),
});

export interface DuelRequest {
  original: string;
  patched: string;
  language: SupportedLanguage;
  username: string;
  password: string;
}

/** Sends a login probe to be executed in the isolated SQLi fixture against both versions. */
export async function sendDuelProbe(request: DuelRequest): Promise<DuelProbeResult> {
  try {
    const res = await fetch("/api/duel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const parsed = DuelResponseSchema.safeParse(await res.json());
    if (res.ok && parsed.success) return parsed.data;
    return { available: false, message: `Probe request failed (HTTP ${res.status}).` };
  } catch {
    return { available: false, message: "Network error sending the probe." };
  }
}
