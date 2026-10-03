import { Platform, processColor, StyleSheet } from "react-native"
import { wideGamutColor, wideGamutComponents } from "../core/color"

/**
 * Wide-gamut output. The engine resolves every color to sRGB `rgba(...)` (what React Native
 * parses, animates and mixes), clipping Tailwind's oklch colors that lie outside sRGB. Where
 * the platform can show more, styles get the color it stands for instead:
 *
 * - web: `color(display-p3 ...)`, as CSS shows oklch on wide-gamut screens.
 * - iOS: `{ space: "display-p3", r, g, b, a }`, which UIKit renders in Display P3.
 * - Android: sRGB. Its views take 8-bit sRGB colors; P3 components would be misread.
 */

const COLOR_KEY = /(^c|C)olor$/
const RGBA = /rgba\([^)]*\)/g

interface P3Color {
  space: "display-p3"
  r: number
  g: number
  b: number
  a: number
}

const isP3 = (v: unknown): v is P3Color =>
  typeof v === "object" && v !== null && (v as { space?: unknown }).space === "display-p3"

/**
 * The color to render a resolved color with. On the web, a color the engine clipped to
 * sRGB comes back as the wide-gamut CSS color it stands for (`color(display-p3 ...)`), for
 * SVG paint and other raw CSS. Elsewhere, and for colors that fit sRGB, it is unchanged.
 */
export function displayColor(color: string): string
export function displayColor(color: string | undefined): string | undefined
export function displayColor(color: string | undefined) {
  if (color === undefined || Platform.OS !== "web") return color
  return wideGamutColor(color) ?? color
}

/** A style with its clipped colors replaced by their wide-gamut form, where the platform has one. */
export function wideGamutStyle<S>(style: S): S {
  if (Platform.OS !== "web" && Platform.OS !== "ios") return style
  if (!style || typeof style !== "object") return style
  let out: Record<string, unknown> | undefined
  const src = style as Record<string, unknown>
  for (const k in src) {
    const v = src[k]
    if (typeof v !== "string") continue
    let next: unknown
    if (Platform.OS === "web") {
      if (COLOR_KEY.test(k)) {
        // A clipped color, or one already given as its wide-gamut CSS (from `displayColor`).
        // react-native-web passes `var(...)` through untouched; `color(display-p3 ...)` it would drop.
        const wide = wideGamutColor(v) ?? (v.startsWith("color(") ? v : undefined)
        if (wide) next = `var(--aw-wide-gamut, ${wide})`
      } else if (k === "boxShadow" && v.includes("rgba(")) {
        const replaced = v.replace(RGBA, (m) => wideGamutColor(m) ?? m)
        if (replaced !== v) next = replaced
      }
    } else if (COLOR_KEY.test(k) && nativeWideGamut) {
      const c = wideGamutComponents(v)
      if (c) next = { space: "display-p3", r: c[0], g: c[1], b: c[2], a: c[3] } satisfies P3Color
    }
    if (next !== undefined) (out ??= { ...src })[k] = next
  }
  return (out ?? style) as S
}

/** Whether a resolved color has a wide-gamut form on this platform (transitions re-render to it). */
export function hasWideGamut(color: unknown): boolean {
  if (typeof color !== "string") return false
  if (Platform.OS === "web") return wideGamutColor(color) !== undefined
  return Platform.OS === "ios" && nativeWideGamut && wideGamutComponents(color) !== undefined
}

// Style attributes React Native processes as colors.
const COLOR_ATTRIBUTES = [
  "color",
  "backgroundColor",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "borderStartColor",
  "borderEndColor",
  "borderBlockColor",
  "borderBlockStartColor",
  "borderBlockEndColor",
  "outlineColor",
  "shadowColor",
  "textDecorationColor",
  "textShadowColor",
  "tintColor",
  "overlayColor",
]

let nativeWideGamut = false
let installed = false

/**
 * iOS: lets `{ space: "display-p3", ... }` colors through React Native's style processing.
 * UIKit (and Fabric's color parser) read them, but `processColor` drops any color object
 * that isn't a PlatformColor or DynamicColorIOS. Every other value is processed as before.
 */
export function installNativeWideGamut() {
  if (installed) return
  installed = true
  if (Platform.OS !== "ios" || typeof StyleSheet.setStyleAttributePreprocessor !== "function") return
  const process = (value: unknown) => (isP3(value) ? value : processColor(value as Parameters<typeof processColor>[0]))
  // React Native warns (in development) whenever a preprocessor is replaced; this one is deliberate.
  const warn = console.warn
  console.warn = () => {}
  try {
    for (const key of COLOR_ATTRIBUTES) StyleSheet.setStyleAttributePreprocessor(key, process)
    nativeWideGamut = true
  } catch {
    nativeWideGamut = false
  } finally {
    console.warn = warn
  }
}
