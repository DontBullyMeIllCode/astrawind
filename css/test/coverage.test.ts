import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { compileTheme, resolve, TAILWIND_VERSION, type ResolveEnv } from "../src/core"

/**
 * Every class and variant the installed Tailwind generates must resolve: either
 * to native styles or, for web-only features, to a deliberate no-op. Only the
 * variants below may be reported as having no native equivalent.
 */
const NO_NATIVE_EQUIVALENT = new Set([
  "before",
  "after",
  "file",
  "marker",
  "backdrop",
  "first-letter",
  "first-line",
  "details-content",
  "inert",
])

const require = createRequire(import.meta.url)

async function loadTailwind() {
  const tw = require("tailwindcss")
  const dir = path.dirname(require.resolve("tailwindcss/package.json"))
  const css = fs.readFileSync(path.join(dir, "index.css"), "utf8")
  const version = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).version as string
  const ds = await tw.__unstable__loadDesignSystem(css, { base: dir })
  return { ds, version }
}

function env(onUnsupported: (cls: string, reason: string) => void): ResolveEnv {
  const t = compileTheme({}, "light")
  return {
    getVar: t.getVar,
    rem: 16,
    em: 16,
    windowWidth: 400,
    windowHeight: 800,
    colorScheme: "light",
    platform: "ios",
    rtl: false,
    breakpoints: t.breakpoints,
    containerSizes: t.containerSizes,
    self: { attrs: {} },
    groups: {},
    ancestors: [],
    onUnsupported,
  }
}

describe("tailwind coverage", () => {
  it("uses the theme of the installed Tailwind", async () => {
    const { version } = await loadTailwind()
    expect(TAILWIND_VERSION).toBe(version)
  })

  it("resolves every utility", async () => {
    const { ds } = await loadTailwind()
    const classes: string[] = ds.getClassList().map((c: [string, unknown]) => c[0])
    expect(classes.length).toBeGreaterThan(20000)
    const unknown: string[] = []
    for (const cls of classes) resolve(cls, env(() => unknown.push(cls)))
    expect(unknown).toEqual([])
  }, 60000)

  it("resolves every variant", async () => {
    const { ds } = await loadTailwind()
    // Functional variants need a value to be meaningful.
    const samples: Record<string, string> = {
      group: "group-hover",
      peer: "peer-checked",
      not: "not-hover",
      in: "in-data-[slot=x]",
      has: "has-checked",
      aria: "aria-checked",
      data: "data-[state=open]",
      nth: "nth-2",
      "nth-last": "nth-last-2",
      "nth-of-type": "nth-of-type-2",
      "nth-last-of-type": "nth-last-of-type-2",
      supports: "supports-[display:grid]",
      max: "max-[600px]",
      min: "min-[600px]",
      "@max": "@max-md",
      "@min": "@min-md",
      "@": "@md",
      "*": "*",
      "**": "**",
    }
    const unsupported: string[] = []
    for (const { name } of ds.getVariants() as { name: string }[]) {
      const variant = samples[name] ?? name
      resolve(`${variant}:flex`, env(() => unsupported.push(name)))
    }
    expect(unsupported.filter((v) => !NO_NATIVE_EQUIVALENT.has(v))).toEqual([])
  }, 60000)
})
