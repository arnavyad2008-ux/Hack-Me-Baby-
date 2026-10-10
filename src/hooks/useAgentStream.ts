import { useState, useCallback, useRef } from "react";
import { useCyberArena } from "./useCyberArenaState";
import { StreamEventPayload } from "@/types";

export function useAgentStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    targetCode,
    activePresetId,
    setPhase,
    appendRedStream,
    appendBlueStream,
    setActiveVulnerability,
    setPatchedCode,
    setScorecard,
  } = useCyberArena();

  const handleEvent = useCallback(
    (event: StreamEventPayload) => {
      setPhase(event.phase);

      if (event.type === "recon" || (event.phase === "RED_RECON" && event.text)) {
        appendRedStream(event.text);
      } else if (event.type === "exploit" || event.phase === "RED_EXPLOIT") {
        appendRedStream(event.text);
        if (event.data?.vulnerability) {
          setActiveVulnerability(event.data.vulnerability);
        }
      } else if (event.type === "intercept" || event.phase === "BLUE_INTERCEPT") {
        appendBlueStream(event.text);
      } else if (event.type === "patch" || event.phase === "BLUE_PATCH") {
        appendBlueStream(event.text);
        if (event.data?.patchedCode) {
          setPatchedCode(event.data.patchedCode);
        }
      } else if (event.type === "scorecard" || event.phase === "RESOLVED") {
        appendBlueStream(event.text);
        if (event.data?.scorecard) {
          setScorecard(event.data.scorecard);
        }
      }
    },
    [setPhase, appendRedStream, appendBlueStream, setActiveVulnerability, setPatchedCode, setScorecard]
  );

  const startAudit = useCallback(async () => {
    setIsStreaming(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      setPhase("RED_RECON");
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: targetCode,
          presetId: activePresetId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`Audit stream error: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("ReadableStream not available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const rawJson = line.slice(6).trim();
            if (rawJson) {
              try {
                const parsed: StreamEventPayload = JSON.parse(rawJson);
                handleEvent(parsed);
              } catch (parseErr) {
                console.error("Failed to parse SSE payload", parseErr);
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [targetCode, activePresetId, setPhase, handleEvent]);

  const abortAudit = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return { isStreaming, error, startAudit, abortAudit };
}
