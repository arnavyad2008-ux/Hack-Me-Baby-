import "server-only";
import ts from "typescript";
import type { SupportedLanguage } from "@/shared/contracts/limits";

/** Static, non-executing helpers over the TypeScript compiler API. */

function fileNameFor(language: SupportedLanguage): string {
  return language === "typescript" ? "candidate.ts" : "candidate.js";
}

export function parseSource(code: string, language: SupportedLanguage): ts.SourceFile {
  return ts.createSourceFile(fileNameFor(language), code, ts.ScriptTarget.ES2022, true);
}

function formatDiagnostic(d: ts.Diagnostic): string {
  const message = ts.flattenDiagnosticMessageText(d.messageText, "\n");
  if (!d.file || d.start === undefined) return message;
  const { line } = d.file.getLineAndCharacterOfPosition(d.start);
  return `line ${line + 1}: ${message}`;
}

/** Syntax errors only (no type information). */
export function syntaxErrors(code: string, language: SupportedLanguage): string[] {
  const out = ts.transpileModule(code, {
    fileName: fileNameFor(language),
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return (out.diagnostics ?? []).map(formatDiagnostic);
}

/** Strips TypeScript syntax so the module can be executed by the isolated runner. */
export function transpileToEsm(code: string, language: SupportedLanguage): string {
  return ts.transpileModule(code, {
    fileName: fileNameFor(language),
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
}

export function importSpecifiers(source: ts.SourceFile): string[] {
  const specs: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      specs.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require"))
    ) {
      const arg = node.arguments[0];
      specs.push(arg && ts.isStringLiteral(arg) ? arg.text : "<dynamic>");
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return specs;
}

export function exportsFunction(source: ts.SourceFile, name: string): boolean {
  return source.statements.some((stmt) => {
    const exported =
      ts.canHaveModifiers(stmt) && ts.getModifiers(stmt)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) return false;
    if (ts.isFunctionDeclaration(stmt)) return stmt.name?.text === name;
    if (ts.isVariableStatement(stmt)) {
      return stmt.declarationList.declarations.some(
        (d) => ts.isIdentifier(d.name) && d.name.text === name
      );
    }
    return false;
  });
}

const libCache = new Map<string, ts.SourceFile>();

/** Type-checks `code` against ambient declarations without emitting or executing anything. */
export function typeErrors(code: string, ambientDeclarations: string): string[] {
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
    types: [],
    strict: true,
    noEmit: true,
  };
  const memory = new Map([
    ["/fixture/candidate.ts", code],
    ["/fixture/contract.d.ts", ambientDeclarations],
  ]);
  const host = ts.createCompilerHost(options);
  const defaultGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError) => {
    const text = memory.get(fileName);
    if (text !== undefined) return ts.createSourceFile(fileName, text, languageVersion, true);
    const cached = libCache.get(fileName);
    if (cached) return cached;
    const file = defaultGetSourceFile(fileName, languageVersion, onError);
    if (file && fileName.includes("/typescript/lib/")) libCache.set(fileName, file);
    return file;
  };
  const defaultFileExists = host.fileExists.bind(host);
  host.fileExists = (fileName) => memory.has(fileName) || defaultFileExists(fileName);
  const defaultReadFile = host.readFile.bind(host);
  host.readFile = (fileName) => memory.get(fileName) ?? defaultReadFile(fileName);

  const program = ts.createProgram(["/fixture/candidate.ts", "/fixture/contract.d.ts"], options, host);
  return ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file?.fileName === "/fixture/candidate.ts")
    .map(formatDiagnostic);
}
