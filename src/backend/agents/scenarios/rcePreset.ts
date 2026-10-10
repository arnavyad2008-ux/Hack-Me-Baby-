import type { DemoScenario } from "./types";

export const rceScenario: DemoScenario = {
  presetId: "rce-command",
  red: {
    summary: "A request field is interpolated into a shell command string.",
    findings: [
      {
        id: "F-1",
        title: "OS command injection in ping diagnostic",
        cwe: "CWE-78",
        severity: "CRITICAL",
        confidence: "HIGH",
        explanation:
          "host is taken from the request body and interpolated into the string passed to exec, which runs it through a shell; metacharacters such as ';' or '&&' append arbitrary commands.",
        locations: [{ startLine: 8, endLine: 8 }],
        evidence: ["exec(`ping -c 4 ${host}`, (err, stdout) => {"],
        demonstrationInput: "host: 127.0.0.1; id",
        assumptions: ["The process runs with a shell available (default for exec)."],
      },
    ],
    missingContext: ["Whether hostnames (not just IPs) must be supported by callers."],
  },
  blue: {
    patchedCode: `import { execFile } from "child_process";
import { isIP } from "net";

export async function pingHost(req: Request) {
  const { host } = await req.json();

  // Accept only a literal IP address and pass it as an argument, without a shell
  if (typeof host !== "string" || isIP(host) === 0) {
    throw new Error("host must be an IPv4 or IPv6 address");
  }

  return new Promise((resolve, reject) => {
    execFile("ping", ["-c", "4", host], (err, stdout) => {
      if (err) return reject(err);
      resolve({ output: stdout });
    });
  });
}`,
    addressedFindingIds: ["F-1"],
    changes: ["Validate host as a literal IP address.", "Use execFile with an argument array so no shell parses the input."],
    dependencies: [],
    limitations: [
      "Illustrative only: this patch is not executed or tested here.",
      "Behaviour change: hostnames are no longer accepted.",
    ],
  },
  redNarration: ["Recorded finding F-1 (CWE-78): request field interpolated into exec() at line 8."],
  blueNarration: ["Recorded patch: IP validation plus execFile argument array."],
};
