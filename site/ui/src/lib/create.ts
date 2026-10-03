import { baseColors, themeColors, type BaseColor, type CssVars, type ThemeColor } from "@astrawind/ui"

/**
 * The Create page's design options, like ui.shadcn.com/create's, limited to what
 * `ThemeProvider` can express: base color, theme color, chart color, radius, menu
 * colors and menu accent. Every option maps to a `ThemeProvider` prop (see
 * `themeProps`), so the preview and the generated code can't disagree.
 */

export const BASE_COLORS = Object.keys(baseColors) as BaseColor[]
export const THEME_COLORS = Object.keys(themeColors) as ThemeColor[]

/** "default" is the base color itself (no `themeColor`). */
export type ThemeChoice = "default" | ThemeColor

export const RADII = [
  { name: "default", label: "Default", value: "" },
  { name: "none", label: "None", value: "0" },
  { name: "small", label: "Small", value: "0.45rem" },
  { name: "medium", label: "Medium", value: "0.625rem" },
  { name: "large", label: "Large", value: "0.875rem" },
] as const
export type RadiusName = (typeof RADII)[number]["name"]

export const MENU_COLORS = [
  { value: "default", label: "Default" },
  { value: "inverted", label: "Inverted" },
] as const
export type MenuColor = (typeof MENU_COLORS)[number]["value"]

export const MENU_ACCENTS = [
  { value: "subtle", label: "Subtle" },
  { value: "bold", label: "Bold" },
] as const
export type MenuAccent = (typeof MENU_ACCENTS)[number]["value"]

export type Mode = "light" | "dark"

export interface CreateOptions {
  baseColor: BaseColor
  theme: ThemeChoice
  /** Colors for chart-1…5. `null` follows the theme. */
  chartColor: ThemeChoice | null
  radius: RadiusName
  menu: MenuColor
  menuAccent: MenuAccent
}

export const DEFAULT_OPTIONS: CreateOptions = {
  baseColor: "neutral",
  theme: "default",
  chartColor: null,
  radius: "default",
  menu: "default",
  menuAccent: "subtle",
}

export function titleCase(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const oneOf = <T extends string>(values: readonly T[], value: unknown): T | undefined =>
  typeof value === "string" && (values as readonly string[]).includes(value) ? (value as T) : undefined

const THEME_CHOICES: ThemeChoice[] = ["default", ...THEME_COLORS]

type Params = Record<string, string | string[] | undefined>

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

/** Reads options from URL search params; anything unknown falls back to the default. */
export function parseOptions(params: Params): CreateOptions {
  const theme = oneOf(THEME_CHOICES, first(params.theme)) ?? DEFAULT_OPTIONS.theme
  const chartColor = oneOf(THEME_CHOICES, first(params.chartColor)) ?? null
  return {
    baseColor: oneOf(BASE_COLORS, first(params.baseColor)) ?? DEFAULT_OPTIONS.baseColor,
    theme,
    chartColor: chartColor === theme ? null : chartColor,
    radius: oneOf(RADII.map((r) => r.name), first(params.radius)) ?? DEFAULT_OPTIONS.radius,
    menu: oneOf(MENU_COLORS.map((m) => m.value), first(params.menu)) ?? DEFAULT_OPTIONS.menu,
    menuAccent: oneOf(MENU_ACCENTS.map((m) => m.value), first(params.menuAccent)) ?? DEFAULT_OPTIONS.menuAccent,
  }
}

export function parseMode(params: Params): Mode | undefined {
  return oneOf(["light", "dark"] as const, first(params.mode))
}

/**
 * Options as search params, for `router.setParams`: defaults are `undefined`,
 * which removes them from the URL.
 */
export function toParams(options: CreateOptions): Record<keyof CreateOptions, string | undefined> {
  const out = {} as Record<keyof CreateOptions, string | undefined>
  for (const key of Object.keys(DEFAULT_OPTIONS) as (keyof CreateOptions)[]) {
    const value = options[key]
    out[key] = value === null || value === DEFAULT_OPTIONS[key] ? undefined : String(value)
  }
  if (options.chartColor === options.theme) out.chartColor = undefined
  return out
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function randomOptions(): CreateOptions {
  const theme = Math.random() < 0.2 ? "default" : pick(THEME_COLORS)
  // Mostly keep the charts on the theme, like upstream's shuffle.
  const chartColor = Math.random() < 0.6 ? null : pick(THEME_CHOICES.filter((t) => t !== theme))
  return {
    baseColor: pick(BASE_COLORS),
    theme,
    chartColor,
    radius: pick(RADII).name,
    menu: pick(MENU_COLORS).value,
    menuAccent: pick(MENU_ACCENTS).value,
  }
}

/** The effective chart color: the chosen one, or the theme. */
export function chartColorOf(options: CreateOptions): ThemeChoice {
  return options.chartColor ?? options.theme
}

export interface ThemeProps {
  baseColor?: BaseColor
  themeColor?: ThemeColor
  radius?: string
  cssVars?: CssVars
}

const CHART_KEYS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const

/** The `ThemeProvider` props for the options: only non-default ones. */
export function themeProps(options: CreateOptions): ThemeProps {
  const props: ThemeProps = {}
  if (options.baseColor !== DEFAULT_OPTIONS.baseColor) props.baseColor = options.baseColor
  if (options.theme !== "default") props.themeColor = options.theme
  const radius = RADII.find((r) => r.name === options.radius)
  if (radius?.value) props.radius = radius.value

  const light: Record<string, string> = {}
  const dark: Record<string, string> = {}
  const chart = chartColorOf(options)
  if (chart !== options.theme) {
    // chart-1…5 from another theme color (or the base color's grays).
    const source = chart === "default" ? baseColors[options.baseColor] : themeColors[chart]
    const sl = source.light as Record<string, string>
    const sd = source.dark as Record<string, string>
    for (const key of CHART_KEYS) {
      light[key] = sl[key]
      dark[key] = sd[key]
    }
  }
  if (options.menu === "inverted") {
    // Menus, popovers and selects on the foreground color.
    for (const vars of [light, dark]) {
      vars.popover = "var(--foreground)"
      vars["popover-foreground"] = "var(--background)"
    }
  }
  if (options.menuAccent === "bold") {
    // Highlighted menu items (and other `accent` surfaces) in the primary color.
    for (const vars of [light, dark]) {
      vars.accent = "var(--primary)"
      vars["accent-foreground"] = "var(--primary-foreground)"
    }
  }
  if (Object.keys(light).length) props.cssVars = { light, dark }
  return props
}

const IDENT = /^[A-Za-z_$][\w$]*$/

function formatVars(vars: Record<string, string>, indent: string) {
  return Object.entries(vars)
    .map(([k, v]) => `${indent}${IDENT.test(k) ? k : JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join("\n")
}

/** The `<ThemeProvider …>` element for the options, props one per line. */
export function themeProviderJsx(options: CreateOptions, children = "<App />") {
  const props = themeProps(options)
  const lines: string[] = []
  if (props.baseColor) lines.push(`baseColor="${props.baseColor}"`)
  if (props.themeColor) lines.push(`themeColor="${props.themeColor}"`)
  if (props.radius) lines.push(`radius="${props.radius}"`)
  if (props.cssVars) {
    const blocks = (["light", "dark"] as const)
      .filter((scheme) => props.cssVars?.[scheme])
      .map((scheme) => `    ${scheme}: {\n${formatVars(props.cssVars![scheme]!, "      ")}\n    },`)
    lines.push(`cssVars={{\n${blocks.join("\n")}\n  }}`)
  }
  const open = lines.length ? `<ThemeProvider\n${lines.map((l) => `  ${l}`).join("\n")}\n>` : "<ThemeProvider>"
  return `${open}\n  ${children}\n</ThemeProvider>`
}

/** A complete root component using the options. */
export function generateCode(options: CreateOptions) {
  const jsx = themeProviderJsx(options, "<Main />")
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n")
  return `import { ThemeProvider } from "@astrawind/ui"

export default function App() {
  return (
${jsx}
  )
}
`
}

export const INSTALL_COMMAND =
  "npx expo install @astrawind/ui @astrawind/css lucide-react-native react-native-svg react-native-safe-area-context"

/** A swatch color for a base color: its muted foreground, as upstream's picker shows. */
export function baseSwatch(baseColor: BaseColor) {
  return (baseColors[baseColor].dark as Record<string, string>)["muted-foreground"]
}

/** A swatch color for a theme choice: its primary, or the base color's swatch. */
export function themeSwatch(theme: ThemeChoice, baseColor: BaseColor) {
  return theme === "default" ? baseSwatch(baseColor) : (themeColors[theme].dark as Record<string, string>).primary
}

/** The label for a theme choice ("default" shows the base color's name). */
export function themeLabel(theme: ThemeChoice, baseColor: BaseColor) {
  return titleCase(theme === "default" ? baseColor : theme)
}
