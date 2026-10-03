/// <reference types="vite/client" />
import * as React from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { ThemeProvider } from "@astrawind/ui"

/**
 * Server-renders every module under src/registry/ (charts, home cards, create
 * previews): each named export that is a component, in light and dark mode.
 * Catches crashes and React errors; look at the site for visuals.
 */

const IGNORED = [/collapsable/, /pointerEvents is deprecated/]
const ignored = (args: unknown[]) => IGNORED.some((re) => args.some((a) => typeof a === "string" && re.test(a)))

const modules = import.meta.glob<Record<string, unknown>>("../src/registry/**/*.tsx", { eager: true })

describe("registry renders", () => {
  for (const [file, mod] of Object.entries(modules)) {
    for (const [name, value] of Object.entries(mod)) {
      if (typeof value !== "function" || !/^[A-Z]/.test(name)) continue
      const Component = value as React.ComponentType
      for (const scheme of ["light", "dark"] as const) {
        it(`${file.replace("../src/registry/", "")} ${name} (${scheme})`, () => {
          const errors: unknown[] = []
          const spy = vi.spyOn(console, "error").mockImplementation((...args) => {
            if (!ignored(args)) errors.push(args)
          })
          try {
            const html = renderToString(
              <ThemeProvider forcedTheme={scheme}>
                <Component />
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
  }
})
