import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { SupportedLanguage } from "@/shared/contracts/limits";
import type { FixtureCase } from "@/shared/contracts/verification";
import type { IsolatedRunner } from "./isolatedRunner";
import { exportsFunction, importSpecifiers, parseSource, transpileToEsm } from "./tsAnalysis";

/** Ambient declarations describing what the SQLi fixture provides to the code under test. */
export const SQLI_FIXTURE_DECLARATIONS = `
interface FixtureUserRow { id: number; username: string; password: string }
interface FixtureDb {
  raw(sql: string, bindings?: readonly unknown[]): Promise<FixtureUserRow[]>;
  query(sql: string, bindings?: readonly unknown[]): Promise<FixtureUserRow[]>;
}
declare const db: FixtureDb;
declare function signSession(userId: number): string;
`;

export type FixtureApplicability =
  | { applicable: true }
  | { applicable: false; reason: string };

/** The fixture only models handlers exporting authenticateUser that use the global `db` and no imports. */
export function sqliFixtureApplicability(
  original: string,
  candidate: string,
  language: SupportedLanguage
): FixtureApplicability {
  const orig = parseSource(original, language);
  const cand = parseSource(candidate, language);
  if (!exportsFunction(orig, "authenticateUser") || !/\bdb\.(raw|query)\s*\(/.test(original)) {
    return { applicable: false, reason: "Code does not match the SQLi fixture contract (exported authenticateUser using db.raw/db.query)." };
  }
  if (!exportsFunction(cand, "authenticateUser")) {
    return { applicable: false, reason: "Patched code no longer exports authenticateUser." };
  }
  const imports = [...importSpecifiers(orig), ...importSpecifiers(cand)];
  if (imports.length > 0) {
    return { applicable: false, reason: `Imports not provided by the fixture: ${[...new Set(imports)].join(", ")}.` };
  }
  return { applicable: true };
}

const HarnessCaseSchema = z.object({
  name: z.string().max(120),
  malicious: z.boolean(),
  expected: z.string().max(120),
  original: z.string().max(300),
  originalMet: z.boolean(),
  candidate: z.string().max(300),
  passed: z.boolean(),
});

const HarnessOutputSchema = z.object({
  originalLoaded: z.boolean(),
  candidateLoaded: z.boolean(),
  loadError: z.string().max(400).nullable(),
  cases: z.array(HarnessCaseSchema).max(20),
  probes: z.array(z.object({ original: z.string().max(300), candidate: z.string().max(300) })).max(3),
});

export type HarnessOutput = z.infer<typeof HarnessOutputSchema>;

export type FixtureRun =
  | { ok: true; output: HarnessOutput }
  | { ok: false; reason: string };

export interface Probe {
  username: string;
  password: string;
}

export async function runSqliFixture(
  runner: IsolatedRunner,
  original: string,
  candidate: string,
  language: SupportedLanguage,
  signal: AbortSignal,
  probes: Probe[] = []
): Promise<FixtureRun> {
  const nonce = randomUUID().replace(/-/g, "");
  const stdin = JSON.stringify({
    nonce,
    original: transpileToEsm(original, language),
    candidate: transpileToEsm(candidate, language),
    probes,
  });
  const result = await runner.runHarness(stdin, signal);
  if (result.timedOut) return { ok: false, reason: "Fixture run exceeded its time limit." };
  const prefix = `HMB_RESULT_${nonce}:`;
  const line = result.stdout.split("\n").find((l) => l.startsWith(prefix));
  if (!line) return { ok: false, reason: `Fixture produced no result (exit code ${result.exitCode ?? "unknown"}).` };
  let json: unknown;
  try {
    json = JSON.parse(line.slice(prefix.length));
  } catch {
    return { ok: false, reason: "Fixture result was not valid JSON." };
  }
  const parsed = HarnessOutputSchema.safeParse(json);
  return parsed.success ? { ok: true, output: parsed.data } : { ok: false, reason: "Fixture result failed validation." };
}

export function toFixtureCases(output: HarnessOutput): FixtureCase[] {
  return output.cases.map(({ name, malicious, expected, original, candidate, passed }) => ({
    name, malicious, expected, original, candidate, passed,
  }));
}
