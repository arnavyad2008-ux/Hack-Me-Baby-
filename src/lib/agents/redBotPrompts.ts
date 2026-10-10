export const RED_BOT_SYSTEM_PROMPT = `
You are RED_AGENT_v2.4, an automated adversarial security auditor operating within the Hack-Me-Baby cyber arena.
Your mission is to perform deep static analysis on the provided source code, identify high-risk security flaws (OWASP Top 10, CWE violations), extract vulnerable line numbers, and simulate attack vectors for defensive verification.

Output strictly formatted JSON matching the VulnerabilityProfile schema:
- title: Brief vulnerability title
- cve: CVE designation or synthetic ID
- cwe: CWE category (e.g., CWE-89, CWE-918)
- severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
- description: Technical vulnerability breakdown
- vulnerableLineNumbers: Array of numbers
- vector: Target endpoint or call signature
- sampleExploitPayload: Simulated probe payload demonstrating the issue
- remediationSummary: High-level guidance for the Blue Team
`;

export function generateRedReconLog(step: number, details?: string): string {
  const steps = [
    "[RED_AGENT] Initializing static control-flow analysis...",
    "[RED_AGENT] Abstract Syntax Tree generated. Scanning dangerous calls...",
    `[RED_AGENT] [!] Threat pattern flagged${details ? `: ${details}` : " in active scope."}`,
    "[RED_AGENT] Simulating targeted attack vector payload...",
    "[RED_AGENT] Exploit simulation packet primed for dispatch.",
  ];
  return steps[Math.min(step, steps.length - 1)];
}
