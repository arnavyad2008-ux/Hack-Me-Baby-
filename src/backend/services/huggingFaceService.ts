import "server-only";
import {
  InferenceClient,
  InferenceClientHubApiError,
  InferenceClientProviderApiError,
  PROVIDERS_OR_POLICIES,
  type InferenceProviderOrPolicy,
} from "@huggingface/inference";
import type { ServerEnv } from "@/backend/config/serverEnv";
import { abortableDelay, CancelledError, ProviderError, type LlmProvider } from "./llmProvider";

const MAX_RESPONSE_CHARS = 60_000;
const RETRY_BACKOFF_MS = [1_000, 3_000, 6_000];

// A type alias (not interface) so it satisfies the SDK's index-signature input type.
type ChatArgs = {
  model: string;
  provider: InferenceProviderOrPolicy;
  messages: Array<{ role: "system" | "user"; content: string }>;
  max_tokens: number;
  temperature: number;
};
interface ChatOutput {
  choices: Array<{ message?: { content?: string | null } }>;
}
export type ChatFn = (args: ChatArgs, options: { signal: AbortSignal; retry_on_error: boolean }) => Promise<ChatOutput>;

function isProvider(value: string): value is InferenceProviderOrPolicy {
  return (PROVIDERS_OR_POLICIES as readonly string[]).includes(value);
}

function httpStatus(err: unknown): number | null {
  if (err instanceof InferenceClientProviderApiError || err instanceof InferenceClientHubApiError) {
    return err.httpResponse.status;
  }
  return null;
}

/** Maps upstream failures to ProviderError without echoing request details (which carry the token). */
function classify(err: unknown): ProviderError {
  const status = httpStatus(err);
  if (status === 401 || status === 403) {
    return new ProviderError("PROVIDER_ERROR", `Hugging Face rejected the credentials (HTTP ${status}). Check HF_TOKEN.`);
  }
  if (status === 429 || (status !== null && status >= 500)) {
    return new ProviderError("PROVIDER_ERROR", `Hugging Face is unavailable or rate limited (HTTP ${status}).`, true);
  }
  if (status !== null) {
    return new ProviderError("PROVIDER_ERROR", `Hugging Face request failed (HTTP ${status}). Check HF_MODEL/HF_PROVIDER.`);
  }
  if (err instanceof TypeError) {
    return new ProviderError("PROVIDER_ERROR", "Network error contacting Hugging Face.", true);
  }
  return new ProviderError("PROVIDER_ERROR", "Hugging Face request failed.");
}

/** Returns null when HF_TOKEN is absent so callers can report a configuration error. */
export function createHuggingFaceProvider(env: ServerEnv, chat?: ChatFn): LlmProvider | null {
  if (!env.HF_TOKEN) return null;
  if (!isProvider(env.HF_PROVIDER)) {
    throw new ProviderError("CONFIG_MISSING", `HF_PROVIDER "${env.HF_PROVIDER}" is not a supported provider.`);
  }
  const provider = env.HF_PROVIDER;
  let send: ChatFn;
  if (chat) {
    send = chat;
  } else {
    const client = new InferenceClient(env.HF_TOKEN);
    send = (args, options) => client.chatCompletion(args, options);
  }

  return {
    label: `Hugging Face · ${env.HF_MODEL}`,
    async complete({ system, user, maxTokens, signal }) {
      for (let attempt = 0; ; attempt++) {
        if (signal.aborted) throw new CancelledError();
        const deadline = AbortSignal.timeout(env.LLM_TIMEOUT_MS);
        const attemptSignal = AbortSignal.any([signal, deadline]);
        try {
          const out = await send(
            {
              model: env.HF_MODEL,
              provider,
              messages: [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
              max_tokens: maxTokens,
              temperature: 0.1,
            },
            { signal: attemptSignal, retry_on_error: false }
          );
          const content = out.choices[0]?.message?.content;
          if (typeof content !== "string" || content.trim() === "") {
            throw new ProviderError("INVALID_MODEL_OUTPUT", "The model returned an empty response.");
          }
          return content.slice(0, MAX_RESPONSE_CHARS);
        } catch (err) {
          if (signal.aborted) throw new CancelledError();
          if (err instanceof ProviderError) throw err;
          if (deadline.aborted) {
            throw new ProviderError("PROVIDER_TIMEOUT", `The model did not respond within ${env.LLM_TIMEOUT_MS / 1000}s.`);
          }
          const failure = classify(err);
          if (!failure.retryable || attempt >= env.LLM_MAX_RETRIES) throw failure;
          console.warn(`[llm] transient provider failure, retry ${attempt + 1}/${env.LLM_MAX_RETRIES}`);
          await abortableDelay(RETRY_BACKOFF_MS[attempt] ?? 6_000, signal);
        }
      }
    },
  };
}
