import { PresetScenario } from "./types";

export const rceScenario: PresetScenario = {
  snippet: {
    id: "rce-command",
    name: "System Diagnostic (RCE)",
    language: "typescript",
    vulnerabilityType: "CWE-78: OS Command Injection",
    description: "Unsanitized user-supplied IP passed directly into child_process.exec.",
    code: `import { exec } from "child_process";

export async function pingHost(req: Request) {
  const { host } = await req.json();

  // VULNERABLE: Direct shell command concatenation
  return new Promise((resolve, reject) => {
    exec(\`ping -c 4 \${host}\`, (err, stdout) => {
      if (err) return reject(err);
      resolve({ output: stdout });
    });
  });
}`,
  },
  vulnerability: {
    id: "vuln-rce-03",
    title: "Remote Command Execution via Unsanitized Shell String",
    cve: "CVE-2024-7801",
    cwe: "CWE-78",
    severity: "CRITICAL",
    description: "User parameter interpolation into shell execution environment allows arbitrary OS command injection via shell metacharacters (; | &&).",
    vulnerableLineNumbers: [7],
    vector: "POST /api/diagnostics/ping",
    sampleExploitPayload: "127.0.0.1; cat /etc/passwd",
    remediationSummary: "Use execFile with argument array separation and strict IPv4/IPv6 regex validation.",
  },
  patchedCode: `import { execFile } from "child_process";
import { z } from "zod";

const PingSchema = z.object({
  host: z.string().ip({ version: "v4", message: "Only valid IPv4 addresses allowed" }),
});

export async function pingHost(req: Request) {
  const body = await req.json();
  const { host } = PingSchema.parse(body);

  // SECURED: execFile with isolated argument array bypasses system shell
  return new Promise((resolve, reject) => {
    execFile("ping", ["-c", "4", host], (err, stdout) => {
      if (err) return reject(err);
      resolve({ output: stdout });
    });
  });
}`,
  scorecard: {
    initialRiskScore: 10.0,
    postPatchRiskScore: 0.5,
    cvssReduction: 9.5,
    defenseGrade: "A+",
    owaspCategory: "A03:2021-Injection",
    mitigationStatus: "VERIFIED_SECURE",
    keyRemediations: [
      "Replaced exec with execFile to eliminate shell interpreter invocation",
      "Enforced strict Zod IPv4 format validation",
      "Segregated arguments into immutable string array",
    ],
  },
  redLogs: [
    "[RED_AGENT] Inspecting system diagnostics router...",
    "[RED_AGENT] Flagged child_process.exec with untrusted template literal at line 7.",
    "[RED_AGENT] Shell delimiter character probe: ';' / '&&' / '|'.",
    "[RED_AGENT] Synthesizing command injection payload: '127.0.0.1; cat /etc/passwd'.",
    "[RED_AGENT] Dispatched payload packet to OS shell execution sink.",
  ],
  blueLogs: [
    "[BLUE_AGENT] [ALERT] Intercepted hostile shell delimiter payload.",
    "[BLUE_AGENT] Root cause verified: Shell execution without argument boundaries (CWE-78).",
    "[BLUE_AGENT] Replacing shell execution with isolated binary spawn (execFile).",
    "[BLUE_AGENT] Adding RFC IPv4 IP-address validator guard.",
    "[BLUE_AGENT] [SUCCESS] Arbitrary command execution vector neutralized.",
  ],
};
