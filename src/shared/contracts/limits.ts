/** Bounds shared by the client (upload/editor) and server (request validation). */
export const MAX_SOURCE_CHARS = 20_000;
export const MAX_SOURCE_LINES = 600;
export const MAX_UPLOAD_BYTES = 64 * 1024;
export const MAX_REQUEST_BYTES = 96 * 1024;

export const SUPPORTED_LANGUAGES = ["typescript", "javascript"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const EXTENSION_LANGUAGE: Record<string, SupportedLanguage> = {
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
};

export const SUPPORTED_UPLOAD_ACCEPT = Object.keys(EXTENSION_LANGUAGE)
  .map((ext) => `.${ext}`)
  .join(",");

/** Returns the supported language for a file name, or null when unsupported. */
export function languageForFileName(fileName: string): SupportedLanguage | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_LANGUAGE[ext] ?? null;
}
