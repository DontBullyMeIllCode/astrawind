// Generates src/generated/default-theme.ts from tailwindcss/theme.css so AstraWind's
// scales (colors, spacing, type, radii, shadows...) match Tailwind exactly.
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const twDir = path.dirname(require.resolve("tailwindcss/package.json"))
const version = JSON.parse(fs.readFileSync(path.join(twDir, "package.json"), "utf8")).version
const css = fs.readFileSync(path.join(twDir, "theme.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "")

// Every variable in theme.css's @theme blocks, minus the @keyframes rules nested in them.
function stripBlocks(src, at) {
  let out = ""
  let i = 0
  while (i < src.length) {
    const j = src.indexOf(at, i)
    if (j < 0) return out + src.slice(i)
    out += src.slice(i, j)
    let depth = 0
    let k = src.indexOf("{", j)
    for (; k < src.length; k++) {
      if (src[k] === "{") depth++
      else if (src[k] === "}" && --depth === 0) break
    }
    i = k + 1
  }
  return out
}
const body = stripBlocks(css, "@keyframes")
const vars = {}
for (const m of body.matchAll(/--([\w-]+(?:\\\.[\w-]+)?):\s*([^;]+);/g)) {
  const name = m[1].replace(/\\\./g, ".")
  const value = m[2].replace(/\s+/g, " ").trim()
  if (value.startsWith("--theme(")) continue
  vars[name] = value
}
const out = `// Generated from tailwindcss@${version} theme.css by scripts/gen-theme.mjs. Do not edit.
export const TAILWIND_VERSION = ${JSON.stringify(version)}
export const defaultTheme: Record<string, string> = ${JSON.stringify(vars, null, 2)}
`
fs.writeFileSync(path.join(pkg, "src/generated/default-theme.ts"), out)
console.log(`✔ ${Object.keys(vars).length} theme variables from tailwindcss@${version}`)
