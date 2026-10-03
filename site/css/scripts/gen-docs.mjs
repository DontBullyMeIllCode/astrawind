#!/usr/bin/env node
/**
 * Generates the quick reference tables of the utility pages from the installed
 * Tailwind: every class and its CSS, grouped by the page whose properties it sets
 * (src/docs/nav.ts), and how many of them have a native effect (for the sidebar
 * badges). The table's native styles are resolved by @astrawind/css in the app.
 *
 * Run it again after changing @astrawind/css (and building it), so the counts stay current.
 *
 *   node scripts/gen-docs.mjs   →   src/generated/utilities.json
 */
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { compileTheme, resolve } from "@astrawind/css/core"
import { nativeEffect } from "../src/docs/native.ts"
import { utilityPages } from "../src/docs/nav.ts"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const require = createRequire(import.meta.url)

/** Rows per page; pages with more (colors, masks) say how many were left out. */
const MAX_ROWS = 400

const tw = require("tailwindcss")
const twDir = path.dirname(require.resolve("tailwindcss/package.json"))
const version = JSON.parse(fs.readFileSync(path.join(twDir, "package.json"), "utf8")).version
const ds = await tw.__unstable__loadDesignSystem(fs.readFileSync(path.join(twDir, "index.css"), "utf8"), { base: twDir })

const listed = ds.getClassList().map((c) => c[0])
const isListed = new Set(listed)
const extra = utilityPages.flatMap((p) => p.extra ?? [])
const classes = [...listed, ...extra.filter((c) => !isListed.has(c))]
const css = ds.candidatesToCss(classes)

/** Multi-property helpers appear only on pages that list them in `extra`. */
const ONLY_EXTRA = new Set(["sr-only", "not-sr-only"])

/** Drops `@property` registrations and the `@layer properties` fallback Tailwind emits. */
function stripBoilerplate(text) {
  let out = ""
  let i = 0
  while (i < text.length) {
    const at = text.slice(i).search(/@property|@layer properties/)
    if (at < 0) {
      out += text.slice(i)
      break
    }
    out += text.slice(i, i + at)
    let j = text.indexOf("{", i + at)
    let depth = 0
    for (; j < text.length; j++) {
      if (text[j] === "{") depth++
      else if (text[j] === "}" && --depth === 0) break
    }
    i = j + 1
  }
  return out
}

function declarations(text) {
  const decls = []
  for (const m of stripBoilerplate(text).matchAll(/^\s*(--[\w-]+|-?[a-z][\w-]*)\s*:\s*([^;{}]+);/gm)) {
    decls.push([m[1], m[2].trim()])
  }
  return decls
}

const rows = Object.fromEntries(utilityPages.map((p) => [p.slug, []]))
classes.forEach((cls, i) => {
  if (!css[i]) return
  const decls = declarations(css[i])
  if (!decls.length) return
  const props = new Set(decls.map(([p]) => p))
  // Show the real properties; internal `--tw-*` variables only when that's all there is.
  const shown = decls.filter(([p]) => !p.startsWith("--"))
  const text = [...new Set((shown.length ? shown : decls).map(([p, v]) => `${p}: ${v};`))].join("\n")
  for (const page of utilityPages) {
    if (page.extra?.includes(cls)) {
      rows[page.slug].push([cls, text])
      continue
    }
    if (ONLY_EXTRA.has(cls) || !isListed.has(cls)) continue
    const match = page.props ?? new RegExp(`^${page.slug}$`)
    if (page.classes && !page.classes.test(cls)) continue
    if ([...props].some((p) => match.test(p))) rows[page.slug].push([cls, text])
  }
})

// Native support is counted as on a phone: iOS, light mode, default theme.
const theme = compileTheme({}, "light")
const supported = new Map()
const resolveNative = (className) =>
  resolve(className, {
    getVar: theme.getVar,
    breakpoints: theme.breakpoints,
    containerSizes: theme.containerSizes,
    rem: theme.rem,
    em: theme.rem,
    windowWidth: 390,
    windowHeight: 844,
    colorScheme: "light",
    platform: "ios",
    rtl: false,
    self: { attrs: {} },
    groups: {},
    ancestors: [],
  })
function hasNativeEffect(cls) {
  if (!supported.has(cls)) supported.set(cls, nativeEffect(cls, resolveNative).length > 0)
  return supported.get(cls)
}

const out = { tailwind: version, pages: {} }
for (const [slug, list] of Object.entries(rows)) {
  const native = list.filter(([cls]) => hasNativeEffect(cls)).length
  out.pages[slug] = { total: list.length, native, rows: list.slice(0, MAX_ROWS) }
}

const file = path.join(root, "src/generated/utilities.json")
fs.mkdirSync(path.dirname(file), { recursive: true })
fs.writeFileSync(file, JSON.stringify(out))
const empty = Object.entries(rows).filter(([, l]) => !l.length).map(([s]) => s)
console.log(`Tailwind ${version}: ${listed.length} classes → ${utilityPages.length} pages, ${(fs.statSync(file).size / 1024).toFixed(0)} KB`)
if (empty.length) console.log(`Pages with no classes: ${empty.join(", ")}`)
