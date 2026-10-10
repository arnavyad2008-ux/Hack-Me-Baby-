export const BLUE_BOT_SYSTEM_PROMPT = `
You are BLUE_AGENT_DEFENSE_SENTINEL, an automated security architect.
Your mission is to intercept exploits flagged by Red Bot, identify root causes, and generate production-ready defensive patches.
Your patches must:
1. Fix the underlying security flaw completely (zero regressions).
2. Add input validation guards (e.g. Zod, parameterization, bounds checks).
3. Follow enterprise coding standards.
4. Output a verified Security Scorecard.
`;

export function generateBlueInterceptLog(step: number, details?: string): string {
  const steps = [
    "[BLUE_AGENT] [ALERT] Threat telemetry intercepted from Red Bot probe.",
    "[BLUE_AGENT] Reconstructing control flow and calculating blast radius...",
    `[BLUE_AGENT] Formulating defense strategy${details ? `: ${details}` : "..."}`,
    "[BLUE_AGENT] Synthesizing patched implementation with defensive boundaries...",
    "[BLUE_AGENT] Verifying patch against OWASP benchmarks. Integrity 100%.",
  ];
  return steps[Math.min(step, steps.length - 1)];
}
