import "server-only";
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const blocked = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blocked.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of [
  ["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8], ["64:ff9b::", 96], ["2001:db8::", 32],
] as const) blocked.addSubnet(net, prefix, "ipv6");

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, "ipv4");
  if (family !== 6) return false;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (mapped) return !blocked.check(mapped[1], "ipv4");
  return !blocked.check(address, "ipv6");
}

/**
 * Rejects non-HTTP(S) URLs and hosts resolving to private/reserved ranges.
 * Callers must also disable redirects. A DNS-rebinding window remains between
 * this check and the actual connection.
 */
export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(raw)?.[1]?.toLowerCase();
  if (scheme && /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) && scheme !== "http" && scheme !== "https") {
    throw new Error("Only http(s) URLs are allowed.");
  }
  let url: URL;
  try {
    url = new URL(scheme === "http" || scheme === "https" ? raw : `https://${raw}`);
  } catch {
    throw new Error("Invalid URL.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only http(s) URLs are allowed.");
  if (url.username || url.password) throw new Error("URLs with credentials are not allowed.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  let addresses: Array<{ address: string }>;
  try {
    addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new Error(`Could not resolve ${host}.`);
  }
  if (addresses.length === 0 || !addresses.every((a) => isPublicAddress(a.address))) {
    throw new Error("Target resolves to a private or reserved address and was not contacted.");
  }
  return url;
}
