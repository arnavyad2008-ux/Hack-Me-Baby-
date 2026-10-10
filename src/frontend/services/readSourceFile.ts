import {
  languageForFileName,
  MAX_SOURCE_CHARS,
  MAX_UPLOAD_BYTES,
  type SupportedLanguage,
} from "@/shared/contracts/limits";

export type ReadResult =
  | { ok: true; code: string; fileName: string; language: SupportedLanguage }
  | { ok: false; message: string };

/** Validates and reads an uploaded source file. Nothing is sent anywhere. */
export async function readSourceFile(file: File): Promise<ReadResult> {
  const language = languageForFileName(file.name);
  if (!language) {
    return { ok: false, message: "Only TypeScript/JavaScript files (.ts, .tsx, .js, .jsx, .mjs, .cjs) are supported." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: `File is larger than ${Math.round(MAX_UPLOAD_BYTES / 1024)} KB.` };
  }
  let code: string;
  try {
    code = await file.text();
  } catch {
    return { ok: false, message: "The file could not be read." };
  }
  if (code.includes("\u0000")) return { ok: false, message: "The file looks binary, not source code." };
  if (code.trim().length < 5) return { ok: false, message: "The file is empty." };
  if (code.length > MAX_SOURCE_CHARS) {
    return { ok: false, message: `File exceeds ${MAX_SOURCE_CHARS.toLocaleString()} characters.` };
  }
  return { ok: true, code, fileName: file.name, language };
}
