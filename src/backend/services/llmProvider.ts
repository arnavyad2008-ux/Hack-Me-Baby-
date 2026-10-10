import "server-only";
import type { ErrorCode } from "@/shared/contracts/events";

export type ProviderErrorCode = Extract<
  ErrorCode,
  "CONFIG_MISSING" | "PROVIDER_ERROR" | "PROVIDER_TIMEOUT" | "INVALID_MODEL_OUTPUT"
>;

export class ProviderError extends Error {
  constructor(
    readonly code: ProviderErrorCode,
    message: string,
    readonly retryable = false
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export class CancelledError extends Error {
  constructor() {
    super("Run cancelled");
    this.name = "CancelledError";
  }
}

export interface CompletionRequest {
  system: string;
  user: string;
  maxTokens: number;
  signal: AbortSignal;
}

export interface LlmProvider {
  readonly label: string;
  complete(request: CompletionRequest): Promise<string>;
}

/** Resolves after `ms`, or rejects with CancelledError as soon as `signal` aborts. */
export function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new CancelledError());
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new CancelledError());
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
