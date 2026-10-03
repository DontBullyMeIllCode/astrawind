import * as React from "react"
import { AccessibilityInfo, useColorScheme } from "react-native"
import { compileTheme, type AstraWindTheme, type ColorScheme, type CompiledTheme } from "../core/theme"
import type { Attrs, ElementState } from "../core/variants"

export interface AstraWindContextValue {
  theme: AstraWindTheme
  compiled: CompiledTheme
  colorScheme: ColorScheme
  /** Warn about classes with no native equivalent. Defaults to __DEV__. */
  warnUnsupported: boolean
  /** The OS "reduce motion" setting, for `motion-safe:`/`motion-reduce:` and transitions. */
  reduceMotion?: boolean
}

const defaultTheme: AstraWindTheme = {}

export const AstraWindContext = React.createContext<AstraWindContextValue>({
  theme: defaultTheme,
  compiled: compileTheme(defaultTheme, "light"),
  colorScheme: "light",
  warnUnsupported: false,
})

/** Text styles that inherit down the tree, as they do in CSS. */
export interface InheritedText {
  color?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  lineHeight?: number
  letterSpacing?: number
  textAlign?: string
  textTransform?: string
  textDecorationLine?: string
  fontVariant?: string[]
  textShadowColor?: string
  textShadowOffset?: { width: number; height: number }
  textShadowRadius?: number
}

export const INHERITED_TEXT_KEYS = [
  "color",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "textTransform",
  "textDecorationLine",
  "fontVariant",
  "textShadowColor",
  "textShadowOffset",
  "textShadowRadius",
] as const

/** Values that cascade from ancestors: text styles, CSS variables, groups, data-slot ancestors. */
export interface Cascade {
  text: InheritedText
  vars?: Record<string, string>
  groups: Record<string, ElementState>
  ancestors: Attrs[]
  /** Default icon size/color for descendants (the native stand-in for `[&_svg]:size-*`). */
  icon?: { size?: number; color?: string; strokeWidth?: number }
  /** Widths of ancestor query containers by name; `""` is the nearest. */
  containers?: Record<string, number>
  /** Classes every descendant adds, from `**:` variants. */
  descendantClass?: string
  /** Whether the parent's classes make it a flex/grid container (see `ResolveEnv.parentFlex`). */
  flexParent?: boolean
}

export const EMPTY_CASCADE: Cascade = { text: {}, groups: {}, ancestors: [] }
export const CascadeContext = React.createContext<Cascade>(EMPTY_CASCADE)

export interface AstraWindProviderProps {
  theme?: AstraWindTheme
  /** "system" follows the OS. Defaults to "system". */
  colorScheme?: ColorScheme | "system"
  warnUnsupported?: boolean
  children?: React.ReactNode
}

declare const __DEV__: boolean | undefined

export function AstraWindProvider({
  theme = defaultTheme,
  colorScheme = "system",
  warnUnsupported = typeof __DEV__ !== "undefined" && __DEV__,
  children,
}: AstraWindProviderProps) {
  const system = useColorScheme()
  const scheme: ColorScheme = colorScheme === "system" ? (system === "dark" ? "dark" : "light") : colorScheme
  const [reduceMotion, setReduceMotion] = React.useState(false)
  React.useEffect(() => {
    let live = true
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => live && setReduceMotion(v))
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReduceMotion)
    return () => {
      live = false
      sub?.remove()
    }
  }, [])
  const value = React.useMemo<AstraWindContextValue>(
    () => ({ theme, compiled: compileTheme(theme, scheme), colorScheme: scheme, warnUnsupported, reduceMotion }),
    [theme, scheme, warnUnsupported, reduceMotion]
  )
  return <AstraWindContext.Provider value={value}>{children}</AstraWindContext.Provider>
}

export function useAstraWind() {
  return React.useContext(AstraWindContext)
}

/**
 * Sets the default size, color and stroke width for icons rendered below it.
 * The native stand-in for web styles like `[&_svg]:size-4`.
 */
export function IconStyle({
  size,
  color,
  strokeWidth,
  children,
}: NonNullable<Cascade["icon"]> & { children?: React.ReactNode }) {
  const parent = React.useContext(CascadeContext)
  const value = React.useMemo(
    () => ({ ...parent, icon: { ...parent.icon, ...(size !== undefined && { size }), ...(color && { color }), ...(strokeWidth !== undefined && { strokeWidth }) } }),
    [parent, size, color, strokeWidth]
  )
  return <CascadeContext.Provider value={value}>{children}</CascadeContext.Provider>
}
