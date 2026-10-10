import { describe, expect, it } from "vitest";
import { assertPublicHttpUrl, isPublicAddress } from "@/backend/services/outboundUrlGuard";

describe("outbound URL guard (used by the header scanner)", () => {
  it.each(["127.0.0.1", "10.1.2.3", "169.254.169.254", "192.168.0.1", "172.20.0.1", "::1", "fe80::1", "fc00::1", "::ffff:127.0.0.1"])(
    "treats %s as non-public",
    (ip) => expect(isPublicAddress(ip)).toBe(false)
  );

  it("accepts public addresses", () => {
    expect(isPublicAddress("93.184.216.34")).toBe(true);
    expect(isPublicAddress("2606:4700::1111")).toBe(true);
  });

  it.each(["file:///etc/passwd", "gopher://example.com", "http://user:pw@93.184.216.34/", "http://169.254.169.254/latest", "http://[::1]:3000/"])(
    "rejects %s without contacting it",
    async (url) => {
      await expect(assertPublicHttpUrl(url)).rejects.toThrow();
    }
  );
});
