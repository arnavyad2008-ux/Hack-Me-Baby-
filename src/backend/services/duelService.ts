import "server-only";
import type { SupportedLanguage } from "@/shared/contracts/limits";
import type { DuelProbeResult } from "@/shared/types";
import type { IsolatedRunner } from "@/backend/verification/isolatedRunner";
import { runSqliFixture, sqliFixtureApplicability } from "@/backend/verification/sqliFixture";
import { syntaxErrors } from "@/backend/verification/tsAnalysis";

export interface DuelInput {
  original: string;
  patched: string;
  language: SupportedLanguage;
  username: string;
  password: string;
}

/** Runs a user-supplied login probe against the original and patched code in the SQLi fixture. */
export async function runDuelProbe(input: DuelInput, runner: IsolatedRunner, signal: AbortSignal): Promise<DuelProbeResult> {
  if (syntaxErrors(input.patched, input.language).length > 0 || syntaxErrors(input.original, input.language).length > 0) {
    return { available: false, message: "Code has syntax errors, so it cannot be executed in the fixture." };
  }
  const applicability = sqliFixtureApplicability(input.original, input.patched, input.language);
  if (!applicability.applicable) return { available: false, message: applicability.reason };
  const availability = await runner.availability();
  if (!availability.ok) return { available: false, message: availability.reason };

  const run = await runSqliFixture(runner, input.original, input.patched, input.language, signal, [
    { username: input.username, password: input.password },
  ]);
  if (!run.ok) return { available: false, message: run.reason };
  const probe = run.output.probes[0];
  if (!probe) return { available: false, message: run.output.loadError ?? "The fixture could not load the code." };
  return {
    available: true,
    message: "Probe executed in the isolated SQLi fixture.",
    original: probe.original,
    candidate: probe.candidate,
  };
}
