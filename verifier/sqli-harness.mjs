// SQLi fixture harness. Intended to run INSIDE an isolated container (see
// src/backend/verification/isolatedRunner.ts) — never inside the Next.js process.
//
// stdin:  {"nonce": string, "original": string, "candidate": string, "probes"?: [{username, password}]}
//         `original` / `candidate` are ES-module JavaScript exporting authenticateUser(req).
// stdout: one line "HMB_RESULT_<nonce>:<json>"; anything else on stdout is ignored by the server.
//
// Fixture contract: global `db.raw(sql, bindings?)` / `db.query(sql, bindings?)` run against a fresh
// in-memory SQLite users(id, username, password) table; global `signSession(id)` returns "session-<id>".
import { DatabaseSync } from "node:sqlite";

const writeOut = process.stdout.write.bind(process.stdout);
const CASE_TIMEOUT_MS = 2000;

const USERS = [
  [1, "alice", "correct-horse"],
  [2, "bob", "hunter2-strong"],
  [3, "o'brien", "irish-pass"],
];

const CASES = [
  { name: "legitimate login (alice)", username: "alice", password: "correct-horse", expectUser: 1 },
  { name: "legitimate login (bob)", username: "bob", password: "hunter2-strong", expectUser: 2 },
  { name: "legitimate username containing a quote", username: "o'brien", password: "irish-pass", expectUser: 3 },
  { name: "wrong password rejected", username: "alice", password: "wrong", expectUser: null },
  { name: "tautology injection", username: "' OR '1'='1' --", password: "x", expectUser: null, malicious: true },
  { name: "comment out password check", username: "alice' --", password: "x", expectUser: null, malicious: true },
];

function makeDb() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL)");
  const insert = sqlite.prepare("INSERT INTO users (id, username, password) VALUES (?, ?, ?)");
  for (const row of USERS) insert.run(...row);
  const run = async (sql, bindings = []) => {
    if (typeof sql !== "string") throw new TypeError("sql must be a string");
    if (!Array.isArray(bindings)) throw new TypeError("bindings must be an array");
    return sqlite.prepare(sql).all(...bindings);
  };
  return { raw: run, query: run };
}

async function loadModule(source) {
  const url = "data:text/javascript;base64," + Buffer.from(source, "utf8").toString("base64");
  const mod = await import(url);
  if (typeof mod.authenticateUser !== "function") throw new Error("authenticateUser export not found");
  return mod.authenticateUser;
}

function withTimeout(promise) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timed out")), CASE_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function attempt(fn, username, password) {
  globalThis.db = makeDb();
  globalThis.signSession = (id) => `session-${id}`;
  const req = new Request("http://fixture.local/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  try {
    const result = await withTimeout(Promise.resolve().then(() => fn(req)));
    const match = /^session-(\d+)$/.exec(String(result?.token ?? ""));
    if (result?.success === true && match) return { kind: "auth", userId: Number(match[1]) };
    return { kind: "other", detail: "returned without a session token" };
  } catch (err) {
    return { kind: "rejected", detail: String(err?.message ?? err).slice(0, 120) };
  }
}

function describe(o) {
  if (o.kind === "auth") return `authenticated as user ${o.userId}`;
  if (o.kind === "rejected") return `rejected (${o.detail})`;
  return o.detail;
}

function meets(o, expectUser) {
  return expectUser === null ? o.kind !== "auth" : o.kind === "auth" && o.userId === expectUser;
}

async function main() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  const input = JSON.parse(raw);
  const prefix = `HMB_RESULT_${String(input.nonce).replace(/[^A-Za-z0-9]/g, "")}:`;
  // Candidate code must not be able to write result lines.
  for (const key of ["log", "info", "warn", "error", "debug"]) console[key] = () => {};

  const result = { originalLoaded: false, candidateLoaded: false, loadError: null, cases: [], probes: [] };
  let original;
  let candidate;
  try { original = await loadModule(input.original); result.originalLoaded = true; } catch (e) { result.loadError = `original: ${e?.message ?? e}`; }
  try { candidate = await loadModule(input.candidate); result.candidateLoaded = true; } catch (e) { result.loadError = `candidate: ${e?.message ?? e}`; }

  if (original && candidate) {
    for (const c of CASES) {
      const o = await attempt(original, c.username, c.password);
      const p = await attempt(candidate, c.username, c.password);
      result.cases.push({
        name: c.name,
        malicious: Boolean(c.malicious),
        expected: c.expectUser === null ? "not authenticated" : `authenticated as user ${c.expectUser}`,
        original: describe(o),
        originalMet: meets(o, c.expectUser),
        candidate: describe(p),
        passed: meets(p, c.expectUser),
      });
    }
    for (const probe of (input.probes ?? []).slice(0, 3)) {
      const u = String(probe.username ?? "").slice(0, 200);
      const pw = String(probe.password ?? "").slice(0, 200);
      result.probes.push({
        original: describe(await attempt(original, u, pw)),
        candidate: describe(await attempt(candidate, u, pw)),
      });
    }
  }
  writeOut(prefix + JSON.stringify(result) + "\n");
}

main().then(
  () => process.exit(0),
  (err) => {
    writeOut(`HMB_FATAL:${String(err?.message ?? err).slice(0, 200)}\n`);
    process.exit(1);
  }
);
