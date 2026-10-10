import type { SupportedLanguage } from "@/shared/contracts/limits";

export interface PresetSnippet {
  id: PresetId;
  name: string;
  language: SupportedLanguage;
  category: string;
  description: string;
  /** What the demo playback for this preset can actually back up. */
  verificationNote: string;
  code: string;
}

export const PRESET_IDS = ["sql-injection", "ssrf-webhook", "rce-command"] as const;
export type PresetId = (typeof PRESET_IDS)[number];
export const DEFAULT_PRESET_ID: PresetId = "sql-injection";

/**
 * SQLi fixture contract: `db.raw(sql, bindings?)` is a Knex-style raw query on a
 * SQLite `users(id, username, password)` table and `signSession(id)` returns a token.
 */
const SQLI_CODE = `export async function authenticateUser(req: Request) {
  const { username, password } = await req.json();

  // Builds SQL by concatenating request fields
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  const user = await db.raw(query);

  if (!user || user.length === 0) {
    throw new Error("Invalid credentials");
  }

  return { success: true, token: signSession(user[0].id) };
}`;

const SSRF_CODE = `export async function dispatchWebhook(req: Request) {
  const { targetUrl, eventPayload } = await req.json();

  // Fetches whatever URL the caller supplies
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload),
  });

  return { dispatched: true, status: response.status };
}`;

const RCE_CODE = `import { exec } from "child_process";

export async function pingHost(req: Request) {
  const { host } = await req.json();

  // Interpolates the request field into a shell command
  return new Promise((resolve, reject) => {
    exec(\`ping -c 4 \${host}\`, (err, stdout) => {
      if (err) return reject(err);
      resolve({ output: stdout });
    });
  });
}`;

export const PRESET_SNIPPETS: Record<PresetId, PresetSnippet> = {
  "sql-injection": {
    id: "sql-injection",
    name: "Auth Query (SQLi)",
    language: "typescript",
    category: "CWE-89: SQL Injection",
    description: "String-concatenated SQL in a login handler. Backed by an executable SQLite fixture.",
    verificationNote: "Patch can be checked statically and, with an isolated runner, executed against the SQLi fixture.",
    code: SQLI_CODE,
  },
  "ssrf-webhook": {
    id: "ssrf-webhook",
    name: "Webhook Client (SSRF)",
    language: "typescript",
    category: "CWE-918: Server-Side Request Forgery",
    description: "Outbound fetch to a caller-supplied URL. Illustrative only — no executable fixture.",
    verificationNote: "Illustrative: only a syntax check runs; the remediation is not executed or tested.",
    code: SSRF_CODE,
  },
  "rce-command": {
    id: "rce-command",
    name: "System Diagnostic (OS Cmd)",
    language: "typescript",
    category: "CWE-78: OS Command Injection",
    description: "Request field interpolated into a shell command. Illustrative only — no executable fixture.",
    verificationNote: "Illustrative: only a syntax check runs; the remediation is not executed or tested.",
    code: RCE_CODE,
  },
};

export function isPresetId(value: string): value is PresetId {
  return (PRESET_IDS as readonly string[]).includes(value);
}

export function getPresetSnippet(id: PresetId): PresetSnippet {
  return PRESET_SNIPPETS[id];
}

export const ALL_PRESET_SNIPPETS: PresetSnippet[] = PRESET_IDS.map((id) => PRESET_SNIPPETS[id]);
