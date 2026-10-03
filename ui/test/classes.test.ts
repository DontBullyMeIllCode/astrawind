import fs from "node:fs"
import path from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"
import { compileTheme, resolve, splitClassName } from "@astrawind/css/core"
import { createTheme } from "../src/theme"

/**
 * Every class a component writes must be one @astrawind/css can apply (or a
 * deliberate no-op). Web-only selectors have to be translated, not left in.
 */

const dir = path.join(__dirname, "../src/components")
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".tsx"))

const CLASS_CALLS = new Set(["cn", "cva"])
const CLASS_PROPS = /className$/

/** String literals that are class names: className props, and arguments to cn() / cva(). */
function classStrings(file: string): { text: string; line: number }[] {
  const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const out: { text: string; line: number }[] = []
  const collect = (node: ts.Node): void => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      out.push({ text: node.text, line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1 })
      return
    }
    // In cva(), only values are classes; keys are variant names.
    if (ts.isPropertyAssignment(node)) return collect(node.initializer)
    // Skip comparisons and conditions: `size === "sm" && "..."` only contributes its right side.
    if (ts.isBinaryExpression(node) && node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken && node.operatorToken.kind !== ts.SyntaxKind.BarBarToken && node.operatorToken.kind !== ts.SyntaxKind.QuestionQuestionToken) return
    if (ts.isBinaryExpression(node)) return collect(node.right)
    if (ts.isConditionalExpression(node)) return (collect(node.whenTrue), collect(node.whenFalse))
    if (ts.isCallExpression(node) || ts.isElementAccessExpression(node)) return
    ts.forEachChild(node, collect)
  }
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && CLASS_CALLS.has(node.expression.text)) {
      for (const arg of node.arguments) {
        // cva's second argument: only variant values, not compoundVariants' conditions.
        if (ts.isObjectLiteralExpression(arg)) {
          for (const prop of arg.properties) {
            if (!ts.isPropertyAssignment(prop)) continue
            const name = prop.name.getText(source)
            if (name === "defaultVariants") continue
            if (name === "compoundVariants" && ts.isArrayLiteralExpression(prop.initializer)) {
              for (const el of prop.initializer.elements) {
                if (!ts.isObjectLiteralExpression(el)) continue
                for (const p of el.properties) {
                  if (ts.isPropertyAssignment(p) && /^(class|className)$/.test(p.name.getText(source))) collect(p.initializer)
                }
              }
              continue
            }
            collect(prop.initializer)
          }
        } else collect(arg)
      }
    } else if (ts.isJsxAttribute(node) && CLASS_PROPS.test(node.name.getText(source)) && node.initializer) {
      collect(node.initializer)
    } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && /^[A-Z_]+$|Class(es)?$/.test(node.name.text) && node.initializer) {
      // Class constants: `const HEADER = "flex ..."`, `const itemClass = "..."`.
      collect(node.initializer)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return out
}

const compiled = compileTheme(createTheme(), "light")

function unsupported(cls: string): string | undefined {
  let reason: string | undefined
  resolve(cls, {
    getVar: compiled.getVar,
    breakpoints: compiled.breakpoints,
    rem: 16,
    em: 16,
    windowWidth: 390,
    windowHeight: 844,
    colorScheme: "light",
    platform: "ios",
    rtl: false,
    self: { attrs: {} },
    groups: {},
    ancestors: [],
    onUnsupported: (c, r) => {
      if (c === cls) reason ??= r
    },
  })
  return reason
}

describe("component classes", () => {
  for (const f of files) {
    it(f, () => {
      const problems: string[] = []
      for (const { text, line } of classStrings(path.join(dir, f))) {
        for (const cls of splitClassName(text)) {
          const reason = unsupported(cls)
          if (reason) problems.push(`${f}:${line}  ${cls}  (${reason})`)
        }
      }
      expect(problems).toEqual([])
    })
  }
})
