import * as React from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { compileTheme, toColor, toNativeColor } from "@astrawind/css"
import { createTheme, themeColors } from "@astrawind/ui"
import {
  DEFAULT_OPTIONS,
  generateCode,
  parseOptions,
  randomOptions,
  themeProps,
  themeProviderJsx,
  toParams,
  type CreateOptions,
} from "@/lib/create"
import { CreatePreview } from "@/registry/create/preview"

const opts = (o: Partial<CreateOptions>): CreateOptions => ({ ...DEFAULT_OPTIONS, ...o })

describe("lib/create", () => {
  it("defaults produce a bare ThemeProvider", () => {
    expect(themeProps(DEFAULT_OPTIONS)).toEqual({})
    expect(themeProviderJsx(DEFAULT_OPTIONS)).toBe("<ThemeProvider>\n  <App />\n</ThemeProvider>")
    expect(generateCode(DEFAULT_OPTIONS)).toContain('import { ThemeProvider } from "@astrawind/ui"')
  })

  it("emits base color, theme color and radius", () => {
    const jsx = themeProviderJsx(opts({ baseColor: "stone", theme: "blue", radius: "small" }))
    expect(jsx).toBe('<ThemeProvider\n  baseColor="stone"\n  themeColor="blue"\n  radius="0.45rem"\n>\n  <App />\n</ThemeProvider>')
    expect(themeProviderJsx(opts({ radius: "none" }))).toContain('radius="0"')
    expect(themeProviderJsx(opts({ radius: "large" }))).toContain('radius="0.875rem"')
  })

  it("applies the chart color to chart-1…5 only", () => {
    const props = themeProps(opts({ theme: "blue", chartColor: "rose" }))
    expect(props.themeColor).toBe("blue")
    expect(Object.keys(props.cssVars!.light!)).toEqual(["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"])
    expect(props.cssVars!.dark!["chart-1"]).toBe(themeColors.rose.dark["chart-1"])
    expect(themeProviderJsx(opts({ theme: "blue", chartColor: "rose" }))).toContain(
      `"chart-1": "${themeColors.rose.light["chart-1"]}",`
    )
    // Same as the theme: nothing to override.
    expect(themeProps(opts({ theme: "blue", chartColor: "blue" })).cssVars).toBeUndefined()
    // The base color's grays under a colored theme.
    expect(themeProps(opts({ theme: "blue", chartColor: "default" })).cssVars?.light?.["chart-1"]).toBe("oklch(0.87 0 0)")
  })

  it("inverts menus and makes the accent bold with cssVars", () => {
    const code = themeProviderJsx(opts({ menu: "inverted", menuAccent: "bold" }))
    expect(code).toContain('popover: "var(--foreground)",')
    expect(code).toContain('"popover-foreground": "var(--background)",')
    expect(code).toContain('accent: "var(--primary)",')
    expect(code).toContain('"accent-foreground": "var(--primary-foreground)",')
    expect(code).toMatch(/cssVars=\{\{\n {4}light: \{/)
  })

  it("resolves the var() references in the theme", () => {
    const theme = createTheme(themeProps(opts({ theme: "blue", menu: "inverted", menuAccent: "bold" })))
    for (const scheme of ["light", "dark"] as const) {
      const c = compileTheme(theme, scheme)
      const env = { getVar: c.getVar, rem: 16, em: 16, vw: 0, vh: 0 }
      expect(toColor("var(--color-popover)", env)).toBe(toColor("var(--color-foreground)", env))
      expect(toColor("var(--color-accent)", env)).toBe(toNativeColor(themeColors.blue[scheme].primary))
    }
  })

  it("round-trips through search params", () => {
    for (let i = 0; i < 50; i++) {
      const o = randomOptions()
      expect(parseOptions(toParams(o) as Record<string, string>)).toEqual(o)
    }
    expect(toParams(DEFAULT_OPTIONS)).toEqual({
      baseColor: undefined,
      theme: undefined,
      chartColor: undefined,
      radius: undefined,
      menu: undefined,
      menuAccent: undefined,
    })
    expect(parseOptions({ baseColor: "nope", theme: "blue", chartColor: "blue", radius: ["large"] })).toEqual(
      opts({ theme: "blue", radius: "large" })
    )
  })
})

describe("CreatePreview", () => {
  it("restyles with the options", () => {
    const html = (o: Partial<CreateOptions>) => renderToString(<CreatePreview {...o} />)
    const base = html({})
    const blue = html({ theme: "blue" })
    expect(blue).not.toBe(base)
    expect(html({ radius: "none" })).not.toBe(base)
    expect(html({ menu: "inverted" })).not.toBe(base)
    expect(html({ menuAccent: "bold" })).not.toBe(base)
    expect(html({ chartColor: "rose" })).not.toBe(base)
    expect(renderToString(<CreatePreview mode="dark" />)).not.toBe(base)
  })
})
