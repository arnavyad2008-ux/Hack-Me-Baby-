import { InferenceClientProviderApiError } from "@huggingface/inference";
import { describe, expect, it, vi } from "vitest";
import { readServerEnv } from "@/backend/config/serverEnv";
import { createHuggingFaceProvider, type ChatFn } from "@/backend/services/huggingFaceService";
import { CancelledError, ProviderError } from "@/backend/services/llmProvider";

// No real provider request is made in these tests; the SDK call is replaced by a mock.
const env = readServerEnv({ HF_TOKEN: "hf_test_token", LLM_MAX_RETRIES: "2" });
const request = (signal = new AbortController().signal) => ({ system: "s", user: "u", maxTokens: 10, signal });
const ok = { choices: [{ message: { content: '{"ok":true}' } }] };
const httpError = (status: number) =>
  new InferenceClientProviderApiError("upstream", { url: "https://x", method: "POST" }, { requestId: "r", status, body: "" });

describe("Hugging Face provider adapter", () => {
  it("returns null without HF_TOKEN so callers can report configuration", () => {
    expect(createHuggingFaceProvider(readServerEnv({ HF_TOKEN: "" }))).toBeNull();
  });

  it("sends the configured model, provider and a cancellable signal", async () => {
    const chat = vi.fn<ChatFn>().mockResolvedValue(ok);
    const provider = createHuggingFaceProvider(env, chat);
    await expect(provider?.complete(request())).resolves.toBe('{"ok":true}');
    const [args, options] = chat.mock.calls[0] ?? [];
    expect(args).toMatchObject({ model: "Qwen/Qwen2.5-Coder-32B-Instruct", provider: "auto", max_tokens: 10 });
    expect(options?.retry_on_error).toBe(false);
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  it("retries transient 503s then succeeds", async () => {
    vi.useFakeTimers();
    const chat = vi.fn<ChatFn>().mockRejectedValueOnce(httpError(503)).mockResolvedValue(ok);
    const pending = createHuggingFaceProvider(env, chat)?.complete(request());
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(pending).resolves.toBe('{"ok":true}');
    expect(chat).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("does not retry auth failures and never leaks the token", async () => {
    const chat = vi.fn<ChatFn>().mockRejectedValue(httpError(401));
    const err = await createHuggingFaceProvider(env, chat)?.complete(request()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err instanceof ProviderError && err.message.includes("hf_test_token")).toBe(false);
    expect(chat).toHaveBeenCalledTimes(1);
  });

  it("propagates cancellation into the in-flight request", async () => {
    const controller = new AbortController();
    let seen: AbortSignal | undefined;
    const chat: ChatFn = (_args, { signal }) => {
      seen = signal;
      return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
    };
    const pending = createHuggingFaceProvider(env, chat)?.complete(request(controller.signal));
    controller.abort();
    await expect(pending).rejects.toBeInstanceOf(CancelledError);
    expect(seen?.aborted).toBe(true);
  });

  it("rejects empty model responses", async () => {
    const chat = vi.fn<ChatFn>().mockResolvedValue({ choices: [{ message: { content: "" } }] });
    await expect(createHuggingFaceProvider(env, chat)?.complete(request())).rejects.toMatchObject({ code: "INVALID_MODEL_OUTPUT" });
  });
});
