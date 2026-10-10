import "server-only";
import type { ScannedFileReport } from "@/shared/types";
import { assertPublicHttpUrl } from "./outboundUrlGuard";

const HEADER_CHECKS: Array<{ header: string; label: string; why: string; httpsOnly?: boolean }> = [
  { header: "content-security-policy", label: "Missing Content-Security-Policy", why: "No CSP header; the browser has no policy limiting script sources." },
  { header: "strict-transport-security", label: "Missing Strict-Transport-Security", why: "No HSTS header; browsers may allow HTTP downgrades.", httpsOnly: true },
  { header: "x-frame-options", label: "Missing X-Frame-Options", why: "No X-Frame-Options header (a CSP frame-ancestors directive may cover this)." },
];

/** Checks a public URL's response headers. Reports only what the response actually showed. */
export async function scanLiveUrl(targetUrl: string): Promise<ScannedFileReport[]> {
  const url = await assertPublicHttpUrl(targetUrl.trim());
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "Hack-Me-Baby-Header-Check/1.0" },
      signal: AbortSignal.timeout(6_000),
    });
  } catch {
    throw new Error(`Could not reach ${url.host}. No results were generated.`);
  }
  await res.body?.cancel();

  const host = url.host;
  const statusLine = `HTTP ${res.status} from ${url.origin}`;
  const reports: ScannedFileReport[] = HEADER_CHECKS.filter(
    (c) => !(c.httpsOnly && url.protocol !== "https:") && !res.headers.get(c.header)
  ).map((c) => ({
    path: `${host} · response headers`,
    label: c.label,
    snippet: `${statusLine}\n${c.header}: (absent)`,
    explanation: c.why,
    loadable: false,
  }));

  if (res.headers.get("access-control-allow-origin") === "*") {
    reports.push({
      path: `${host} · CORS`,
      label: "Wildcard Access-Control-Allow-Origin",
      snippet: `${statusLine}\naccess-control-allow-origin: *`,
      explanation: "Any origin may read this response. Only a concern if it carries non-public data.",
      loadable: false,
    });
  }
  if (res.status >= 300 && res.status < 400) {
    reports.push({
      path: `${host} · redirect`,
      label: "Redirect not followed",
      snippet: `${statusLine}\nlocation: ${res.headers.get("location") ?? "(none)"}`,
      explanation: "Redirects are not followed for safety; scan the final URL directly.",
      loadable: false,
    });
  }
  if (reports.length === 0) {
    reports.push({
      path: `${host} · response headers`,
      label: "Checked headers present",
      snippet: statusLine,
      explanation: "CSP, HSTS and X-Frame-Options were present. This is a narrow header check, not a security assessment.",
      loadable: false,
    });
  }
  return reports;
}
