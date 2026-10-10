import type { DemoScenario } from "./types";

export const ssrfScenario: DemoScenario = {
  presetId: "ssrf-webhook",
  red: {
    summary: "The handler sends a server-side request to any caller-supplied URL.",
    findings: [
      {
        id: "F-1",
        title: "Server-side request forgery via webhook URL",
        cwe: "CWE-918",
        severity: "HIGH",
        confidence: "HIGH",
        explanation:
          "targetUrl comes from the request body and is fetched without validation, so callers can reach internal services or cloud metadata endpoints from the server's network position.",
        locations: [{ startLine: 2, endLine: 9 }],
        evidence: ["const response = await fetch(targetUrl, {"],
        demonstrationInput: "targetUrl: http://169.254.169.254/latest/meta-data/",
        assumptions: ["The server runs where internal or metadata endpoints are reachable."],
      },
    ],
    missingContext: ["Whether an egress proxy or allow-list exists outside this handler."],
  },
  blue: {
    patchedCode: `import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";

export async function dispatchWebhook(req: Request) {
  const { targetUrl, eventPayload } = await req.json();
  const url = new URL(targetUrl);

  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS webhook targets are allowed");
  }

  // Reject hosts that resolve to private, loopback, link-local or other non-public ranges
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => ipaddr.process(address).range() !== "unicast")) {
    throw new Error("Webhook target resolves to a non-public address");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload),
    redirect: "manual", // a redirect could point at an internal host after the check above
  });

  return { dispatched: true, status: response.status };
}`,
    addressedFindingIds: ["F-1"],
    changes: [
      "Require HTTPS targets.",
      "Resolve every address for the hostname and reject non-unicast (private, loopback, link-local, reserved) ranges.",
      "Disable automatic redirects so a 3xx cannot bounce the request to an internal host.",
    ],
    dependencies: ["ipaddr.js (not installed in this project).", "Node.js runtime for node:dns/promises."],
    limitations: [
      "Illustrative only: this patch is not executed or tested here.",
      "DNS rebinding remains possible: fetch re-resolves the hostname after the check. Pin the connection to the checked address (custom lookup on the HTTP agent/dispatcher) to close this.",
      "Redirect responses are returned to the caller instead of followed.",
    ],
  },
  redNarration: ["Recorded finding F-1 (CWE-918): fetch() called with caller-supplied targetUrl."],
  blueNarration: ["Recorded patch: HTTPS-only, resolve-and-reject private ranges, no redirects. DNS rebinding gap documented."],
};
