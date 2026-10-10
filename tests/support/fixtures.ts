import { getPresetSnippet } from "@/shared/presets/snippets";
import type { RedResult } from "@/shared/contracts/findings";

export const SQLI_ORIGINAL = getPresetSnippet("sql-injection").code;

const CONCAT_LINES = `  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  const user = await db.raw(query);`;

export const SQLI_GOOD_PATCH = SQLI_ORIGINAL.replace(
  CONCAT_LINES,
  `  const user = await db.raw("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);`
);

/** The old repository's "patch": adds comments, changes no behaviour. */
export const SQLI_COMMENT_ONLY_PATCH = `// [BLUE_DEFENSE_PATCHED]\n// Added defensive type validation and parameterized boundaries\n${SQLI_ORIGINAL}`;

/** Blocks the injection but also breaks every legitimate login. */
export const SQLI_OVERBLOCKING_PATCH = SQLI_ORIGINAL.replace(
  CONCAT_LINES,
  `  const user = await db.raw("SELECT * FROM users WHERE 1 = 0 AND username = ?", [username]);`
);

/** Escapes quotes by hand — blocks the tautology but still concatenates SQL. */
export const SQLI_ESCAPING_PATCH = SQLI_ORIGINAL.replace(
  CONCAT_LINES,
  `  const esc = (v: string) => String(v).replace(/'/g, "''");
  const query = "SELECT * FROM users WHERE username = '" + esc(username) + "' AND password = '" + esc(password) + "'";
  const user = await db.raw(query);`
);

export const SQLI_RED: RedResult = {
  summary: "SQL injection.",
  findings: [
    {
      id: "F-1",
      title: "SQL injection",
      cwe: "CWE-89",
      severity: "CRITICAL",
      confidence: "HIGH",
      explanation: "Concatenated SQL.",
      locations: [{ startLine: 5, endLine: 6 }],
      evidence: ["const user = await db.raw(query);"],
      demonstrationInput: "' OR '1'='1' --",
      assumptions: [],
      evidenceInSource: true,
    },
  ],
  missingContext: [],
};
