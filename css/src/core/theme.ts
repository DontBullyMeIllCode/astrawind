import { defaultTheme } from "../generated/default-theme"
import type { FontResolver } from "./resolve"
import { toColor } from "./value"

export interface AstraWindTheme {
  /** Theme name, enables `<name>:` variants (a theme named "brand" matches `brand:`). */
  name?: string
  /**
   * Names of your other themes. Their `<name>:` variants never match under this
   * theme, instead of being reported as unknown.
   */
  themeVariants?: string[]
  /** CSS variables (without `--`) for every color scheme. Extend or override Tailwind's theme. */
  vars?: Record<string, string>
  /** Variables applied in light mode. */
  light?: Record<string, string>
  /** Variables applied in dark mode. */
  dark?: Record<string, string>
  /** Style tokens: `cn-*` classes that expand to utility classes, ranked below plain utilities. */
  styles?: Record<string, string>
  /** Maps a CSS font family + weight to a native font name. */
  fonts?: FontResolver
  /** Root font size in px. Defaults to 16. */
  rem?: number
  /**
   * Outline color when an outline width is set without a color, like a
   * `* { outline-color: ... }` base style. A CSS color; defaults to currentColor.
   */
  outlineColor?: string
}

export type ColorScheme = "light" | "dark"

export interface CompiledTheme {
  name?: string
  themeVariants?: string[]
  getVar: (name: string) => string | undefined
  styles?: Record<string, string>
  fonts?: FontResolver
  rem: number
  breakpoints: Record<string, number>
  /** Container query sizes in px, from `--container-*`. */
  containerSizes: Record<string, number>
  defaultBorderColor?: string
  defaultOutlineColor?: string
}

const cache = new WeakMap<AstraWindTheme, Partial<Record<ColorScheme, CompiledTheme>>>()

export function compileTheme(theme: AstraWindTheme, scheme: ColorScheme): CompiledTheme {
  let entry = cache.get(theme)
  if (!entry) cache.set(theme, (entry = {}))
  const hit = entry[scheme]
  if (hit) return hit

  const vars: Record<string, string> = { ...defaultTheme, ...theme.vars, ...theme[scheme] }
  const getVar = (name: string) => vars[name]
  const rem = theme.rem ?? 16
  const breakpoints: Record<string, number> = {}
  const containerSizes: Record<string, number> = {}
  for (const [k, v] of Object.entries(vars)) {
    const m = /^([\d.]+)(rem|px)$/.exec(v.trim())
    if (!m) continue
    const px = parseFloat(m[1]) * (m[2] === "rem" ? rem : 1)
    if (k.startsWith("breakpoint-")) breakpoints[k.slice(11)] = px
    else if (k.startsWith("container-")) containerSizes[k.slice(10)] = px
  }
  const compiled: CompiledTheme = {
    name: theme.name,
    themeVariants: theme.themeVariants,
    getVar,
    styles: theme.styles,
    fonts: theme.fonts,
    rem,
    breakpoints,
    containerSizes,
    // A theme with `--color-border` gets it as the default border color, like the common
    // `* { border-color: var(--color-border) }` base style. Otherwise it's currentColor.
    defaultBorderColor:
      vars["color-border"] !== undefined
        ? toColor("var(--color-border)", { getVar, rem, em: rem, vw: 0, vh: 0 })
        : undefined,
    defaultOutlineColor: theme.outlineColor
      ? toColor(theme.outlineColor, { getVar, rem, em: rem, vw: 0, vh: 0 })
      : undefined,
  }
  entry[scheme] = compiled
  return compiled
}
