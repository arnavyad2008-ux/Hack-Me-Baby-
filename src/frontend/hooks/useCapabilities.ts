import { useEffect, useState } from "react";
import { z } from "zod";

const CapabilitiesSchema = z.object({
  live: z.object({ configured: z.boolean(), provider: z.string(), model: z.string() }),
  verifier: z.object({ fixtureExecution: z.boolean(), detail: z.string() }),
});

export type Capabilities = z.infer<typeof CapabilitiesSchema>;

let cached: Promise<Capabilities | null> | null = null;

function loadCapabilities(): Promise<Capabilities | null> {
  cached ??= fetch("/api/capabilities")
    .then((res) => res.json())
    .then((json: unknown) => {
      const parsed = CapabilitiesSchema.safeParse(json);
      return parsed.success ? parsed.data : null;
    })
    .catch(() => null);
  return cached;
}

/** Server capabilities (Live configured? fixture runner available?). null while loading or on failure. */
export function useCapabilities(): Capabilities | null {
  const [caps, setCaps] = useState<Capabilities | null>(null);
  useEffect(() => {
    let mounted = true;
    void loadCapabilities().then((value) => {
      if (mounted) setCaps(value);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return caps;
}
