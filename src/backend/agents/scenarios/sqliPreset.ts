import "server-only";
import type { DemoScenario } from "./types";

export const sqliScenario: DemoScenario = {
  presetId: "sql-injection",
  red: {
    summary: "Login query is built by concatenating request fields into SQL, allowing authentication bypass.",
    findings: [
      {
        id: "F-1",
        title: "SQL injection in login query",
        cwe: "CWE-89",
        severity: "CRITICAL",
        confidence: "HIGH",
        explanation:
          "username and password from the request body are concatenated into the SQL text passed to db.raw, so a quote in either field changes the query structure (e.g. a tautology that matches every user).",
        locations: [{ startLine: 5, endLine: 6 }],
        evidence: [
          `const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";`,
          "const user = await db.raw(query);",
        ],
        demonstrationInput: "username: ' OR '1'='1' --   password: anything",
        assumptions: ["Request fields reach this handler without upstream validation."],
      },
      {
        id: "F-2",
        title: "Password compared in plaintext",
        cwe: "CWE-256",
        severity: "MEDIUM",
        confidence: "MEDIUM",
        explanation: "The query matches the submitted password directly against a column, which implies passwords are stored unhashed.",
        locations: [{ startLine: 5, endLine: 5 }],
        evidence: [`password = '" + password + "'`],
        demonstrationInput: null,
        assumptions: ["The password column holds the raw password rather than a hash."],
      },
    ],
    missingContext: ["How the users table stores passwords.", "Whether the route has rate limiting or lockout."],
  },
  blue: {
    patchedCode: `export async function authenticateUser(req: Request) {
  const { username, password } = await req.json();

  // Parameter bindings keep request fields out of the SQL text
  const user = await db.raw(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password]
  );

  if (!user || user.length === 0) {
    throw new Error("Invalid credentials");
  }

  return { success: true, token: signSession(user[0].id) };
}`,
    addressedFindingIds: ["F-1"],
    changes: ["Replaced string concatenation with a parameterised db.raw call using '?' placeholders and a bindings array."],
    dependencies: ["db.raw must support Knex-style positional bindings: raw(sql, [values])."],
    limitations: [
      "F-2 is not addressed: hashing passwords needs a data migration and a hashing library.",
      "SELECT * still loads the password column into application memory.",
    ],
  },
  redNarration: [
    "Recorded finding F-1 (CWE-89): request fields concatenated into SQL at lines 5–6.",
    "Recorded finding F-2 (CWE-256): plaintext password comparison at line 5.",
  ],
  blueNarration: ["Recorded patch: parameterised db.raw with bindings (addresses F-1 only)."],
};
