import "server-only";
import type { RedResult } from "@/shared/contracts/findings";
import type { SupportedLanguage } from "@/shared/contracts/limits";
import type { VerificationCheck, VerificationResult } from "@/shared/contracts/verification";
import type { IsolatedRunner } from "./isolatedRunner";
import { findDynamicSql } from "./sqlHeuristics";
import { runSqliFixture, sqliFixtureApplicability, SQLI_FIXTURE_DECLARATIONS, toFixtureCases } from "./sqliFixture";
import { parseSource, syntaxErrors, typeErrors } from "./tsAnalysis";

export interface VerifyInput {
  original: string;
  patched: string | null;
  language: SupportedLanguage;
  red: RedResult;
  runner: IsolatedRunner;
  signal: AbortSignal;
}

const list = (items: string[]) => items.slice(0, 5).join("; ");

function check(c: VerificationCheck): VerificationCheck {
  return { ...c, detail: c.detail.slice(0, 1500) };
}

async function fixtureCheck(input: VerifyInput, patched: string): Promise<VerificationCheck> {
  const base = { id: "sqli-fixture", kind: "FIXTURE" as const, label: "SQLi fixture execution" };
  const availability = await input.runner.availability();
  if (!availability.ok) return check({ ...base, status: "UNAVAILABLE", detail: availability.reason });
  let run;
  try {
    run = await runSqliFixture(input.runner, input.original, patched, input.language, input.signal);
  } catch (err) {
    if (input.signal.aborted) throw err;
    return check({ ...base, status: "UNAVAILABLE", detail: "Isolated runner failed to start." });
  }
  if (!run.ok) return check({ ...base, status: "FAILED", detail: run.reason });
  const { output } = run;
  const cases = toFixtureCases(output);
  if (!output.candidateLoaded) {
    return check({ ...base, status: "FAILED", detail: `Patched module failed to load: ${output.loadError ?? "unknown"}`, cases });
  }
  if (!output.originalLoaded) {
    return check({ ...base, status: "SKIPPED", detail: `Original module failed to load: ${output.loadError ?? "unknown"}`, cases });
  }
  const reproduced = output.cases.some((c) => c.malicious && !c.originalMet);
  if (!reproduced) {
    return check({ ...base, status: "SKIPPED", detail: "The fixture did not reproduce the injection on the original code, so it cannot judge this patch.", cases });
  }
  const failed = output.cases.filter((c) => !c.passed);
  return failed.length === 0
    ? check({ ...base, status: "PASSED", detail: `Injection reproduced on the original; the patch rejected malicious inputs and kept legitimate logins working (${cases.length}/${cases.length} cases).`, cases })
    : check({ ...base, status: "FAILED", detail: `Failed cases: ${list(failed.map((c) => `${c.name} → ${c.candidate}`))}`, cases });
}

export async function verifyPatch(input: VerifyInput): Promise<VerificationResult> {
  const { patched, language } = input;
  if (patched === null) {
    return { scope: "NOT_RUN", status: "NOT_RUN", summary: "No patch was proposed, so nothing was verified.", checks: [] };
  }
  const checks: VerificationCheck[] = [];
  const syntax = syntaxErrors(patched, language);
  checks.push(check({
    id: "syntax", kind: "SYNTAX", label: `${language} syntax`,
    status: syntax.length === 0 ? "PASSED" : "FAILED",
    detail: syntax.length === 0 ? "Patched code parses without syntax errors." : list(syntax),
  }));

  const sqlRelevant =
    input.red.findings.some((f) => f.cwe === "CWE-89") ||
    findDynamicSql(parseSource(input.original, language)).length > 0;
  if (sqlRelevant && syntax.length === 0) {
    const sites = findDynamicSql(parseSource(patched, language));
    checks.push(check({
      id: "static-sql", kind: "STATIC_SQL", label: "No concatenated SQL reaches db calls (heuristic)",
      status: sites.length === 0 ? "PASSED" : "FAILED",
      detail: sites.length === 0
        ? "No string-built SQL passed to raw/query/execute-style calls. Heuristic only — not proof of safety."
        : `Dynamic SQL still reaches: ${list(sites.map((s) => `line ${s.line} (.${s.method})`))}`,
    }));
  }

  const applicability = sqliFixtureApplicability(input.original, patched, language);
  if (!applicability.applicable) {
    checks.push(check({ id: "sqli-fixture", kind: "FIXTURE", label: "SQLi fixture execution", status: "SKIPPED", detail: applicability.reason }));
  } else if (syntax.length === 0) {
    if (language === "typescript") {
      const types = typeErrors(patched, SQLI_FIXTURE_DECLARATIONS);
      checks.push(check({
        id: "typecheck", kind: "TYPECHECK", label: "Type-check against fixture contract",
        status: types.length === 0 ? "PASSED" : "FAILED",
        detail: types.length === 0 ? "Patched code type-checks against the fixture's db/signSession declarations." : list(types),
      }));
    }
    checks.push(await fixtureCheck(input, patched));
  }
  return summarize(checks, applicability.applicable);
}

function summarize(checks: VerificationCheck[], fixtureApplicable: boolean): VerificationResult {
  const failed = checks.filter((c) => c.status === "FAILED");
  const fixturePassed = checks.some((c) => c.kind === "FIXTURE" && c.status === "PASSED");
  const scope = fixturePassed ? "CONTROLLED_FIXTURE" : fixtureApplicable ? "STATIC_ONLY" : "UNSUPPORTED_CONTEXT";
  if (failed.length > 0) {
    return { scope, status: "FAILED", summary: `Verification failed: ${list(failed.map((c) => c.label))}.`, checks };
  }
  if (fixturePassed) {
    return { scope, status: "PASSED", summary: "Supported checks passed, including execution against the controlled SQLi fixture.", checks };
  }
  if (checks.some((c) => c.status === "PASSED")) {
    return { scope, status: "PASSED", summary: "Supported static checks passed. The patch was not executed.", checks };
  }
  return { scope, status: "UNAVAILABLE", summary: "No applicable verification could run.", checks };
}
