import fs from "fs";
import path from "path";

interface Issue {
  file: string;
  line: number;
  cwe: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  vector: string;
}

function scanFile(filePath: string): Issue[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const issues: Issue[] = [];

  lines.forEach((line, idx) => {
    if (/SELECT.*['"].*\+.*|raw\(.*SELECT.*\+/i.test(line)) {
      issues.push({
        file: filePath,
        line: idx + 1,
        cwe: "CWE-89: SQL Injection",
        severity: "CRITICAL",
        vector: "Direct string concatenation into database sink",
      });
    }
    if (/fetch\([a-zA-Z0-9_]+.*\{/i.test(line) && !line.includes("https:")) {
      issues.push({
        file: filePath,
        line: idx + 1,
        cwe: "CWE-918: SSRF Hazard",
        severity: "HIGH",
        vector: "Unvalidated outbound HTTP fetch target",
      });
    }
  });

  return issues;
}

function walkDir(dir: string): string[] {
  let files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !["node_modules", ".git", ".next"].includes(entry.name)) {
      files = files.concat(walkDir(full));
    } else if (/\.(ts|js)$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

console.log("=================================================");
console.log("HACK ME BABY // CI heuristic pattern scan (advisory)");
console.log("=================================================");
console.log("Two regex patterns (string-built SQL, fetch on a variable). Matches are leads, not confirmed findings.");

const srcDir = path.resolve(process.cwd(), "src");
const allFiles = fs.existsSync(srcDir) ? walkDir(srcDir) : [];
const allIssues: Issue[] = [];

for (const file of allFiles) {
  allIssues.push(...scanFile(file));
}

if (allIssues.length === 0) {
  console.log("\nNo matches for the heuristic patterns. This does not mean the code is free of vulnerabilities.\n");
} else {
  console.log(`\n${allIssues.length} pattern match(es) to review:\n`);
  allIssues.forEach((issue) => {
    console.log(` - [${issue.severity}?] ${issue.cwe} (pattern match)`);
    console.log(`   Location: ${issue.file}:${issue.line}`);
    console.log(`   Pattern: ${issue.vector}\n`);
  });
}
// Advisory only: never fails the build.
process.exit(0);
