import * as React from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { ThemeProvider } from "../src/theme"

/**
 * Renders each component's example (test/examples/<component>.tsx, modeled on
 * shadcn's demo) on react-native-web, in light and dark mode. Catches crashes,
 * invalid hooks and components that can't render; visual checks happen in an app.
 */

/** Warnings from third-party web builds, not from these components. */
const IGNORED = [/collapsable/]
const ignored = (args: unknown[]) => IGNORED.some((re) => args.some((a) => typeof a === "string" && re.test(a)))

const examples = import.meta.glob<{ default: React.ComponentType }>("./examples/*.tsx", { eager: true })

describe("examples render", () => {
  for (const [file, mod] of Object.entries(examples)) {
    const name = file.replace("./examples/", "").replace(".tsx", "")
    for (const scheme of ["light", "dark"] as const) {
      it(`${name} (${scheme})`, () => {
        const errors: unknown[] = []
        const spy = vi.spyOn(console, "error").mockImplementation((...args) => {
          if (!ignored(args)) errors.push(args)
        })
        try {
          const Example = mod.default
          const html = renderToString(
            <ThemeProvider forcedTheme={scheme}>
              <Example />
            </ThemeProvider>
          )
          expect(html.length).toBeGreaterThan(0)
        } finally {
          spy.mockRestore()
        }
        expect(errors).toEqual([])
      })
    }
  }
})
