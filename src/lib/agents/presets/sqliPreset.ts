import { PresetScenario } from "./types";

export const sqliScenario: PresetScenario = {
  snippet: {
    id: "sql-injection",
    name: "Auth Query (SQLi)",
    language: "typescript",
    vulnerabilityType: "CWE-89: SQL Injection",
    description: "Direct SQL string concatenation in auth validation.",
    code: `export async function authenticateUser(req: Request) {
  const { username, password } = await req.json();

  // VULNERABLE: Direct string concatenation allows auth bypass
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  const user = await db.raw(query);

  if (!user || user.length === 0) {
    throw new Error("Invalid credentials");
  }

  return { success: true, token: signSession(user[0].id) };
}`,
  },
  vulnerability: {
    id: "vuln-sqli-01",
    title: "Authentication Bypass via Unsanitized SQL Concat",
    cve: "CVE-2024-8901",
    cwe: "CWE-89",
    severity: "CRITICAL",
    description: "String interpolation into raw SQL query creates arbitrary boolean tautology.",
    vulnerableLineNumbers: [5],
    vector: "POST /api/auth/login",
    sampleExploitPayload: "' OR '1'='1' --",
    remediationSummary: "Parameterized prepared statement with password hash verification.",
  },
  patchedCode: `import bcrypt from "bcrypt";
import { z } from "zod";

const LoginSchema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(8),
});

export async function authenticateUser(req: Request) {
  const body = await req.json();
  const { username, password } = LoginSchema.parse(body);

  // SECURED: Parameterized query prevents SQL injection
  const [user] = await db.query(
    "SELECT id, password_hash FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new Error("Invalid credentials");
  }

  return { success: true, token: signSession(user.id) };
}`,
  scorecard: {
    initialRiskScore: 9.8,
    postPatchRiskScore: 0.8,
    cvssReduction: 9.0,
    defenseGrade: "A+",
    owaspCategory: "A03:2021-Injection",
    mitigationStatus: "VERIFIED_SECURE",
    keyRemediations: [
      "Parameterized prepared statement replaces raw concatenation",
      "Zod schema validation on request payload",
      "Constant-time bcrypt password hash comparison",
    ],
  },
  redLogs: [
    "[RED_AGENT] Initializing static control-flow analysis...",
    "[RED_AGENT] AST parse completed. Inspecting database calls...",
    "[RED_AGENT] [!] DETECTED raw string concatenation at line 5.",
    "[RED_AGENT] Probing vector: 'SELECT * FROM users WHERE username = ' + input",
    "[RED_AGENT] Crafting targeted boolean tautology payload...",
    "[RED_AGENT] Exploit payload synthesized: ' OR '1'='1' --",
    "[RED_AGENT] Dispatching simulated payload injection packet...",
  ],
  blueLogs: [
    "[BLUE_AGENT] [ALERT] Threat telemetry intercepted! Red exploit detected.",
    "[BLUE_AGENT] Analyzing syntax tree vulnerability footprint...",
    "[BLUE_AGENT] Root cause verified: Unescaped SQL concatenation (CWE-89).",
    "[BLUE_AGENT] Synthesizing remediation: Parameterized statement & Bcrypt.",
    "[BLUE_AGENT] Enforcing Zod boundary guard for input validation...",
    "[BLUE_AGENT] Compiling patch with parameterized query...",
    "[BLUE_AGENT] [SUCCESS] Patch verified. Zero syntax regressions.",
  ],
};
