import { describe, expect, it } from "vitest";
import { createUnavailableRunner, type IsolatedRunner } from "@/backend/verification/isolatedRunner";
import { verifyPatch } from "@/backend/verification/verifyPatch";
import { getPresetSnippet } from "@/shared/presets/snippets";
import { createTrustedLocalRunner } from "./support/trustedLocalRunner";
import {
  SQLI_COMMENT_ONLY_PATCH,
  SQLI_ESCAPING_PATCH,
  SQLI_GOOD_PATCH,
  SQLI_ORIGINAL,
  SQLI_OVERBLOCKING_PATCH,
  SQLI_RED,
} from "./support/fixtures";

const signal = new AbortController().signal;
const verify = (patched: string | null, runner: IsolatedRunner = createTrustedLocalRunner()) =>
  verifyPatch({ original: SQLI_ORIGINAL, patched, language: "typescript", red: SQLI_RED, runner, signal });

const fixtureCheck = (r: Awaited<ReturnType<typeof verify>>) => r.checks.find((c) => c.kind === "FIXTURE");

describe("SQLi fixture verification", () => {
  it("reproduces the injection on the original and passes a parameterised patch", async () => {
    const result = await verify(SQLI_GOOD_PATCH);
    const fixture = fixtureCheck(result);
    expect(result.status).toBe("PASSED");
    expect(result.scope).toBe("CONTROLLED_FIXTURE");
    expect(fixture?.status).toBe("PASSED");
    const tautology = fixture?.cases?.find((c) => c.name === "tautology injection");
    expect(tautology?.original).toMatch(/^authenticated as user/);
    expect(tautology?.candidate).toMatch(/^rejected/);
    const legit = fixture?.cases?.find((c) => c.name === "legitimate username containing a quote");
    expect(legit?.candidate).toBe("authenticated as user 3");
  });

  it("fails the comment-only patch the old implementation produced", async () => {
    const result = await verify(SQLI_COMMENT_ONLY_PATCH);
    expect(result.status).toBe("FAILED");
    expect(fixtureCheck(result)?.status).toBe("FAILED");
    expect(result.checks.find((c) => c.kind === "STATIC_SQL")?.status).toBe("FAILED");
  });

  it("fails a patch that blocks injection but breaks legitimate logins", async () => {
    const result = await verify(SQLI_OVERBLOCKING_PATCH);
    const fixture = fixtureCheck(result);
    expect(fixture?.status).toBe("FAILED");
    expect(fixture?.detail).toMatch(/legitimate login/);
  });

  it("evaluates the actual candidate: manual escaping passes the fixture but is flagged statically", async () => {
    const runner = createTrustedLocalRunner();
    const result = await verify(SQLI_ESCAPING_PATCH, runner);
    expect(runner.calls).toBe(1);
    expect(fixtureCheck(result)?.status).toBe("PASSED");
    expect(result.checks.find((c) => c.kind === "STATIC_SQL")?.status).toBe("FAILED");
    expect(result.status).toBe("FAILED");
  });

  it("reports fixture execution as unavailable without an isolated runner and never executes", async () => {
    const result = await verify(SQLI_GOOD_PATCH, createUnavailableRunner("no runner"));
    expect(fixtureCheck(result)?.status).toBe("UNAVAILABLE");
    expect(result.scope).toBe("STATIC_ONLY");
    expect(result.status).toBe("PASSED");
    expect(result.summary).toMatch(/not executed/);
  });

  it("fails syntax and type checks for a broken patch", async () => {
    const broken = await verify("export async function authenticateUser(req: Request) { return {");
    expect(broken.status).toBe("FAILED");
    expect(broken.checks[0]).toMatchObject({ kind: "SYNTAX", status: "FAILED" });
    const badTypes = await verify(SQLI_GOOD_PATCH.replace("signSession(user[0].id)", "signSession(user[0].username)"));
    expect(badTypes.checks.find((c) => c.kind === "TYPECHECK")?.status).toBe("FAILED");
  });

  it("marks code outside the fixture contract as unsupported context", async () => {
    const ssrf = getPresetSnippet("ssrf-webhook").code;
    const result = await verifyPatch({
      original: ssrf, patched: ssrf.replace("fetch(targetUrl", "fetch(new URL(targetUrl)"), language: "typescript",
      red: { summary: "x", findings: [], missingContext: [] }, runner: createTrustedLocalRunner(), signal,
    });
    expect(result.scope).toBe("UNSUPPORTED_CONTEXT");
    expect(fixtureCheck(result)?.status).toBe("SKIPPED");
  });

  it("does not run verification when there is no patch", async () => {
    expect(await verify(null)).toMatchObject({ scope: "NOT_RUN", status: "NOT_RUN" });
  });
});
