import { PresetScenario } from "./types";

export const ssrfScenario: PresetScenario = {
  snippet: {
    id: "ssrf-webhook",
    name: "Webhook Client (SSRF)",
    language: "typescript",
    vulnerabilityType: "CWE-918: Server-Side Request Forgery",
    description: "Blind HTTP fetch to user-controlled destination URL.",
    code: `export async function dispatchWebhook(req: Request) {
  const { targetUrl, eventPayload } = await req.json();

  // VULNERABLE: Arbitrary URL fetch allows attacking internal metadata / LAN
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload),
  });

  return { dispatched: true, status: response.status };
}`,
  },
  vulnerability: {
    id: "vuln-ssrf-02",
    title: "Server-Side Request Forgery to Internal Cloud Metadata",
    cve: "CVE-2024-9182",
    cwe: "CWE-918",
    severity: "HIGH",
    description: "HTTP client executes unvalidated requests to user-supplied URLs, enabling access to internal AWS/GCP metadata endpoints (169.254.169.254).",
    vulnerableLineNumbers: [5],
    vector: "POST /api/webhooks/dispatch",
    sampleExploitPayload: "http://169.254.169.254/computeMetadata/v1/",
    remediationSummary: "Validate protocol, resolve DNS, and block private/link-local CIDR ranges before fetch.",
  },
  patchedCode: `import ipaddr from "ipaddr.js";
import { URL } from "url";

export async function dispatchWebhook(req: Request) {
  const { targetUrl, eventPayload } = await req.json();
  const parsed = new URL(targetUrl);

  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS webhooks permitted");
  }

  // SECURED: Resolve and block private, loopback, and metadata ranges
  const ip = await resolveIp(parsed.hostname);
  if (ipaddr.parse(ip).range() !== "unicast") {
    throw new Error("Access to internal networks denied");
  }

  const response = await fetch(parsed.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload),
  });

  return { dispatched: true, status: response.status };
}`,
  scorecard: {
    initialRiskScore: 8.6,
    postPatchRiskScore: 1.1,
    cvssReduction: 7.5,
    defenseGrade: "A",
    owaspCategory: "A10:2021-Server-Side Request Forgery",
    mitigationStatus: "VERIFIED_SECURE",
    keyRemediations: [
      "Strict HTTPS protocol whitelisting",
      "Pre-flight DNS resolution with CIDR IP filtering",
      "Explicit block on cloud metadata IP range (169.254.x.x)",
    ],
  },
  redLogs: [
    "[RED_AGENT] Probing outbound request handler in 'dispatchWebhook'...",
    "[RED_AGENT] Detected blind HTTP fetch using unvalidated 'targetUrl' parameter.",
    "[RED_AGENT] Target: Link-local instance metadata at 169.254.169.254...",
    "[RED_AGENT] Crafting payload: http://169.254.169.254/computeMetadata/v1/",
    "[RED_AGENT] Attack vector confirmed. Dispatching payload packet...",
  ],
  blueLogs: [
    "[BLUE_AGENT] [INTERCEPT] Outbound network anomaly detected by egress firewall.",
    "[BLUE_AGENT] Identifying SSRF vulnerability signature at line 5.",
    "[BLUE_AGENT] Establishing defensive policy: HTTPS-only + DNS resolution check.",
    "[BLUE_AGENT] Applying RFC 1918 & RFC 3927 IP address quarantine filter.",
    "[BLUE_AGENT] Compiling patch with URL parser and IP validation.",
    "[BLUE_AGENT] [DEFENSE VERIFIED] Metadata exfiltration path neutralized.",
  ],
};
