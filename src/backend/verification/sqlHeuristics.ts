import "server-only";
import ts from "typescript";

const SQL_METHODS = new Set(["raw", "query", "execute", "exec", "all", "get", "run", "prepare", "unsafe"]);
const SQL_KEYWORDS = /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b/i;

export interface DynamicSqlSite {
  line: number;
  method: string;
}

function isConcat(expr: ts.Expression): expr is ts.BinaryExpression {
  return ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.PlusToken;
}

function isStaticString(expr: ts.Expression): boolean {
  if (ts.isParenthesizedExpression(expr)) return isStaticString(expr.expression);
  if (ts.isStringLiteralLike(expr) || ts.isNumericLiteral(expr)) return true;
  if (isConcat(expr)) return isStaticString(expr.left) && isStaticString(expr.right);
  return false;
}

function hasDynamicParts(expr: ts.Expression): boolean {
  if (ts.isParenthesizedExpression(expr)) return hasDynamicParts(expr.expression);
  if (ts.isTemplateExpression(expr)) return expr.templateSpans.length > 0;
  return isConcat(expr) && !isStaticString(expr);
}

function looksLikeSql(expr: ts.Expression, source: ts.SourceFile): boolean {
  return SQL_KEYWORDS.test(expr.getText(source));
}

/**
 * Heuristic: finds database-style calls whose SQL argument is built from string
 * concatenation or template interpolation (directly or via a local variable).
 * It cannot prove the absence of injection; it only flags the common pattern.
 */
export function findDynamicSql(source: ts.SourceFile): DynamicSqlSite[] {
  const initializers = new Map<string, ts.Expression>();
  const collect = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      initializers.set(node.name.text, node.initializer);
    }
    ts.forEachChild(node, collect);
  };
  collect(source);

  const sites: DynamicSqlSite[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      SQL_METHODS.has(node.expression.name.text) &&
      node.arguments.length > 0
    ) {
      let arg = node.arguments[0];
      if (ts.isIdentifier(arg)) arg = initializers.get(arg.text) ?? arg;
      if (hasDynamicParts(arg) && looksLikeSql(arg, source)) {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
        sites.push({ line: line + 1, method: node.expression.name.text });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return sites;
}
