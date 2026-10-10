import "server-only";
import { languageForFileName, MAX_SOURCE_CHARS } from "@/shared/contracts/limits";
import type { ScannedFileReport } from "@/shared/types";

const GITHUB_HEADERS = { "User-Agent": "Hack-Me-Baby-Repo-Ingest", Accept: "application/vnd.github+json" };
const NAME = /^[A-Za-z0-9_.-]{1,100}$/;
const SQL_HINT = /\b(SELECT|INSERT|UPDATE|DELETE)\b[\s\S]{0,200}(\+|\$\{)/i;
const MAX_FILES = 8;

export function parseRepoInput(input: string): { owner: string; repo: string } {
  const clean = input.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/, "").replace(/\/$/, "");
  const [owner, repo] = clean.split("/");
  if (!owner || !repo || !NAME.test(owner) || !NAME.test(repo)) {
    throw new Error("Use 'owner/repo' or a https://github.com/owner/repo URL.");
  }
  return { owner, repo };
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: GITHUB_HEADERS, signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`GitHub API returned HTTP ${res.status}.`);
  return res.json();
}

/** Lists supported source files from a public repo. Results are leads for a Live audit, not findings. */
export async function scanRepository(input: string): Promise<ScannedFileReport[]> {
  const { owner, repo } = parseRepoInput(input);
  const meta = await getJson(`https://api.github.com/repos/${owner}/${repo}`);
  const branch =
    typeof meta === "object" && meta !== null && "default_branch" in meta && typeof meta.default_branch === "string"
      ? meta.default_branch
      : "main";
  const tree = await getJson(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  const nodes = typeof tree === "object" && tree !== null && "tree" in tree && Array.isArray(tree.tree) ? tree.tree : [];

  const paths = nodes
    .filter((n): n is { path: string; type: string; size?: number } =>
      typeof n === "object" && n !== null && typeof n.path === "string" && n.type === "blob")
    .filter((n) => languageForFileName(n.path) !== null && !/(^|\/)(node_modules|dist|build|\.next)\//.test(n.path))
    .filter((n) => (n.size ?? 0) <= MAX_SOURCE_CHARS)
    .map((n) => n.path);

  const reports: ScannedFileReport[] = [];
  for (const path of paths.slice(0, 40)) {
    if (reports.length >= MAX_FILES) break;
    const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${path.split("/").map(encodeURIComponent).join("/")}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) continue;
    const code = await res.text();
    if (code.length > MAX_SOURCE_CHARS) continue;
    const sqlHint = SQL_HINT.test(code);
    reports.push({
      path,
      label: sqlHint ? "Keyword match: SQL built with + or ${}" : "Source file",
      snippet: code,
      explanation: sqlHint
        ? "Text pattern match only. Load it and run a Live audit to analyse it."
        : "No keyword match. Load it and run a Live audit to analyse it.",
      loadable: true,
    });
  }
  if (reports.length === 0) throw new Error("No TypeScript/JavaScript files under the size limit were found.");
  return reports.sort((a, b) => Number(b.label !== "Source file") - Number(a.label !== "Source file"));
}
