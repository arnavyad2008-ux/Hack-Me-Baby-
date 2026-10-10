# Hack Me Baby — Red/Blue code audit with checkable patches

A Next.js app where a **Red agent** (LLM) reports security findings in a TypeScript/JavaScript file, a **Blue agent** (LLM) proposes a minimal patch, and an **independent verifier** checks that patch. The UI keeps three things separate: what a model *claimed*, what was *proposed*, and what was actually *checked*.

The strongest supported path is **SQL injection in TypeScript/JavaScript**, backed by an executable SQLite fixture.

---

## What works today

| Area | Status |
|---|---|
| **Demo mode** | Replays recorded Red/Blue results for three unmodified presets. Labelled as a simulation everywhere; needs no credentials. The recorded patch is still verified for real. |
| **Live mode** | Sends the exact code in the editor to a Hugging Face–hosted model (default `Qwen/Qwen2.5-Coder-32B-Instruct`). Red returns structured findings; Blue returns a patch. If the provider fails or isn't configured, you see the error — there is no silent demo fallback. |
| **Model-output validation** | Zod schemas for every model response. Findings must cite line numbers inside the file; evidence that is not found verbatim in the source is flagged; Blue can only claim findings Red reported. Malformed output fails the run visibly. |
| **Verification** | Syntax check and a fixture type-check (TypeScript compiler API — parses, never executes), plus a heuristic for string-built SQL reaching `db.raw/query/…`. SQLi fixture **execution** of the candidate patch happens only in an isolated Docker container (opt-in). |
| **Duel** | Try your own username input against the original vs. patched code in the SQLi fixture (needs the Docker runner). |
| **Ingest** | Load a TS/JS file from a public GitHub repo for a Live audit; or run a narrow response-header check on a public URL (private/reserved addresses are refused). |

### Outcomes shown after a run

- **No findings reported** — the model reported nothing. Not proof the code is safe.
- **No patch proposed**
- **Patch proposed — not verified** — no applicable check could run.
- **Supported checks passed** — always shown with its scope:
  - *Controlled fixture execution* — the actual candidate patch ran against the SQLi fixture: the injection reproduced on the original, the patch rejected it, and legitimate logins (including a username containing a quote) still worked.
  - *Static checks only* — the fixture applies but the isolated runner is unavailable, so the patch was not executed.
  - *No executable fixture* — e.g. the SSRF and command-injection presets; syntax check only.
- **Verification failed** — at least one check failed (details in the Verification tab).

A model saying its own patch is safe is never counted as verification. There are no CVE IDs, risk scores, or "system secured" claims; findings use internal IDs (`F-1`) and CWE classes.

---

## Demo vs. Live

| | Demo | Live |
|---|---|---|
| Input | Unmodified preset only | Exact editor contents (any preset you edit, uploads, ingested files) |
| Red/Blue output | Recorded, marked **DEMO** | Real model calls |
| Verification | Real | Real |
| Credentials | None | `HF_TOKEN` on the server |

Editing or uploading code detaches it from the preset, switches to Live, and clears all previous findings, patches and verification results. The server also rejects Demo requests whose code doesn't match the preset exactly.

Presets:

- **Auth Query (SQLi)** — executable fixture; fully supported.
- **Webhook Client (SSRF)** — *illustrative only*. The recorded patch resolves the host, rejects non-public ranges and disables redirects, but is not executed here and still has a DNS-rebinding window (documented in the patch's limitations).
- **System Diagnostic (OS command injection)** — *illustrative only*; not executed.

---

## Configuration

Copy `.env.example` to `.env.local`. All variables are server-side; none are exposed to the browser.

| Variable | Default | Purpose |
|---|---|---|
| `HF_TOKEN` | — | Hugging Face token with Inference Providers access. Required for Live mode. |
| `HF_MODEL` | `Qwen/Qwen2.5-Coder-32B-Instruct` | Chat model. |
| `HF_PROVIDER` | `auto` | Inference provider or `auto`. |
| `LLM_TIMEOUT_MS` | `45000` | Per-request deadline. |
| `LLM_MAX_RETRIES` | `2` | Retries for 429/5xx/network errors only. |
| `VERIFIER_RUNTIME` | `none` | `docker` enables fixture execution. `none` never executes patches. |
| `VERIFIER_IMAGE` | `node:24-alpine` | Image for the fixture runner (pull it first; runs use `--pull never`). |
| `VERIFIER_TIMEOUT_MS` | `15000` | Wall-clock limit for a fixture run. |

`GET /api/capabilities` reports whether Live is configured and whether the runner is available (never the token).

### The isolated fixture runner

`verifier/sqli-harness.mjs` loads the original and the candidate patch as ES modules, gives each a fresh in-memory SQLite `users` table through a Knex-style `db.raw(sql, bindings?)`, and runs six login cases against both. With `VERIFIER_RUNTIME=docker` it runs as:

```
docker run --rm -i --pull never --network none --read-only --tmpfs /tmp:size=4m \
  --memory 128m --memory-swap 128m --cpus 0.5 --pids-limit 64 \
  --cap-drop ALL --security-opt no-new-privileges --user 65534:65534 \
  -v ./verifier:/harness:ro node:24-alpine timeout -s KILL 15 node /harness/sqli-harness.mjs
```

No environment variables or credentials are passed into the container, output is capped, and results are validated before use. Generated code is never executed inside the Next.js process, via `eval`, or with `node:vm`.

The fixture contract: the code exports `authenticateUser(req: Request)`, uses the global `db.raw`/`db.query` and `signSession(id)`, and has no imports. Code outside that contract gets static checks only.

---

## Run, test, build

Requires Node.js ≥ 22.13 (tests use `node:sqlite`).

```bash
npm ci
npm run dev          # http://localhost:3000
npm test             # vitest (82 tests; no network or credentials needed)
npm run typecheck
npm run lint
npm run build
```

Tests use mocked providers; no real Hugging Face request is made by the test suite. Fixture tests run the harness locally on hand-written, trusted fixtures only (`tests/support/trustedLocalRunner.ts` is test-only and not wired into the app).

---

## Architecture

```
src/
  app/api/audit          POST → SSE stream (validated events, runId + seq, one terminal event)
  app/api/capabilities   GET  → what is configured
  app/api/duel           POST → fixture probe (runner required)
  app/api/repo-scan      POST → GitHub file listing / URL header check
  backend/               server-only (every module imports "server-only")
    agents/              Red/Blue prompts, output validation, demo recordings
    services/            HF provider adapter, Live pipeline, Demo playback, URL guard
    verification/        TS static checks, SQL heuristic, fixture adapter, Docker runner
    sse/                 stream lifecycle (heartbeat, cancel, safe close)
  frontend/              client components, Zustand store, phase machine, SSE client
  shared/                Zod contracts, SSE parser, presets, limits
verifier/sqli-harness.mjs  runs inside the container only
```

Run lifecycle: `IDLE → RED_ANALYSIS → BLUE_PATCH → VERIFYING → COMPLETED | FAILED | CANCELLED`. One run at a time; target controls lock during a run; cancelling restores the controls immediately and late events from the cancelled run are ignored.

---

## Limitations and remaining work

- **Live mode against a real provider is untested in this repository's checks.** Provider integration is covered by mocked tests; model quality, availability of the default model on HF providers, and prompt robustness need a real `HF_TOKEN` run.
- **Docker runner not exercised in development here** (Docker wasn't available); its flags and secret handling are unit-tested, the harness itself is tested locally on trusted fixtures.
- Fixture execution covers one SQLi contract only. Other code gets static checks; the SQL heuristic can miss indirect query construction and cannot prove safety.
- SSRF and command-injection presets are illustrative.
- Prompt-injection resistance relies on framing and output validation; a hostile file can still steer what the model reports.
- URL header scanning has a DNS-rebinding window between the check and the request.
- Dependency advisories: `next@14.2.35` is the last 14.x release; remaining Next advisories (image optimizer, middleware, rewrites, server actions — features this app doesn't use) are only fixed in Next 16. Tailwind 3's build-time glob dependencies carry ReDoS advisories. Both need a major upgrade.
- The UI was checked by build, type and unit tests and a server smoke test, not by automated browser tests.
