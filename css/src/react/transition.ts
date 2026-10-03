import * as React from "react"
import { Animated, Easing } from "react-native"
import { mixColors } from "../core/color"
import { hasWideGamut } from "./wide-gamut"
import type { Resolved } from "../core/resolve"

/**
 * `transition-*`: animates style changes between renders (hover, press, data-state,
 * dark mode...) the way CSS transitions do. Nothing animates on mount.
 */

type Transition = NonNullable<Resolved["transition"]>
type AnyStyle = Record<string, any>

const COLOR_KEY = /color$/i
const LAYOUT_KEYS = new Set([
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "top",
  "right",
  "bottom",
  "left",
  "start",
  "end",
  "flexBasis",
  "gap",
  "rowGap",
  "columnGap",
  "borderRadius",
  "borderWidth",
  "fontSize",
  "letterSpacing",
  "lineHeight",
])
const isLayoutKey = (k: string) => LAYOUT_KEYS.has(k) || /^(margin|padding|border\w*(Radius|Width))/.test(k)

interface Track {
  value: Animated.Value
  from: number | string
  to: number | string
  pending: boolean
  /** The value a retargeted transition replaced, stopped after render. */
  replaced?: Animated.Value
}

const IDENTITY: Record<string, number | string> = {
  translateX: 0,
  translateY: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotate: "0deg",
  rotateX: "0deg",
  rotateY: "0deg",
  rotateZ: "0deg",
  skewX: "0deg",
  skewY: "0deg",
}

function unitOf(v: number | string) {
  if (typeof v === "number") return { n: v, unit: "" }
  const m = /^(-?[\d.]+)(\w*|%)$/.exec(v)
  return m ? { n: parseFloat(m[1]), unit: m[2] } : undefined
}

/** The value a track shows at `progress`. */
function current(t: Track, progress: number): number | string {
  if (progress >= 1) return t.to
  if (typeof t.from === "number" && typeof t.to === "number") return t.from + (t.to - t.from) * progress
  if (typeof t.from === "string" && typeof t.to === "string") {
    if (t.from.startsWith("rgba") && t.to.startsWith("rgba")) return mixColors(t.to, progress, t.from) ?? t.to
    const a = unitOf(t.from)
    const b = unitOf(t.to)
    if (a && b && a.unit === b.unit) return `${a.n + (b.n - a.n) * progress}${a.unit}`
  }
  return t.to
}

/** Values can animate between each other: two numbers, two colors, or two lengths/angles with the same unit. */
function compatible(a: unknown, b: unknown): a is number | string {
  if (typeof a === "number" && typeof b === "number") return true
  if (typeof a !== "string" || typeof b !== "string") return false
  if (a.startsWith("rgba") && b.startsWith("rgba")) return true
  const ua = unitOf(a)
  const ub = unitOf(b)
  return !!ua && !!ub && ua.unit === ub.unit
}

/** Transform entries as `name → value`, or undefined if the list can't be animated entry by entry. */
function transformMap(t: unknown): Map<string, number | string> | undefined {
  if (t === undefined) return new Map()
  if (!Array.isArray(t)) return undefined
  const out = new Map<string, number | string>()
  for (const entry of t) {
    const [k] = Object.keys(entry)
    if (k === undefined || out.has(k)) return undefined
    out.set(k, entry[k])
  }
  return out
}

export function useTransitionStyle(
  style: AnyStyle,
  transition: Transition | undefined,
  reduceMotion: boolean | undefined
): AnyStyle | undefined {
  const tracks = React.useRef(new Map<string, Track>()).current
  const prevTransform = React.useRef<Map<string, number | string> | undefined>(undefined)
  const active = !!transition && !reduceMotion
  const [, rerender] = React.useReducer((n: number) => n + 1, 0)

  React.useEffect(() => {
    if (!transition) return
    const easing =
      transition.easing === "linear" ? Easing.linear : Easing.bezier(...transition.easing)
    for (const t of tracks.values()) {
      t.replaced?.stopAnimation()
      t.replaced = undefined
      if (!t.pending) continue
      t.pending = false
      const value = t.value
      Animated.timing(value, {
        toValue: 1,
        duration: transition.duration,
        delay: transition.delay,
        easing,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished || t.value !== value) return
        // At rest the track renders its plain value. Interpolated colors are sRGB, so
        // re-render to show a wide-gamut color as the style (not the animation) has it.
        t.from = t.to
        if (hasWideGamut(t.to)) rerender()
      })
    }
  })

  if (!active) {
    tracks.clear()
    prevTransform.current = undefined
    return undefined
  }

  const groups = new Set(transition.groups)
  const out: AnyStyle = {}
  const seen = new Set<string>()

  const track = (key: string, target: number | string): unknown => {
    seen.add(key)
    let t = tracks.get(key)
    if (!t || !compatible(t.to, target)) {
      tracks.set(key, (t = { value: new Animated.Value(1), from: target, to: target, pending: false }))
      return target
    }
    if (t.to !== target) {
      // Retarget from wherever the running animation is, like CSS.
      // Don't touch the value the mounted component is bound to while rendering: on web,
      // JS-driven Animated would update that component mid-render. Start from a new value
      // and stop the old one's animation after the commit.
      const progress = (t.value as unknown as { __getValue(): number }).__getValue()
      t.from = current(t, progress)
      t.to = target
      t.replaced ??= t.value
      t.value = new Animated.Value(0)
      t.pending = true
    }
    if (t.from === t.to) return t.to
    return t.value.interpolate({ inputRange: [0, 1], outputRange: [t.from, t.to] as number[] | string[] })
  }

  for (const key in style) {
    const v = style[key]
    if (typeof v !== "number" && typeof v !== "string") continue
    if (
      (groups.has("colors") && COLOR_KEY.test(key)) ||
      (groups.has("opacity") && key === "opacity") ||
      (groups.has("layout") && isLayoutKey(key))
    ) {
      out[key] = track(key, v)
    }
  }

  if (groups.has("transform")) {
    const next = transformMap(style.transform)
    const prev = prevTransform.current
    if (next && prev && (next.size || prev.size)) {
      // Entries missing on one side animate from/to their identity value.
      const keys = [...new Set([...prev.keys(), ...next.keys()])]
      if (keys.every((k) => next.has(k) || k in IDENTITY)) {
        out.transform = keys.map((k) => ({ [k]: track(`transform.${k}`, next.get(k) ?? IDENTITY[k]) }))
      }
    }
    prevTransform.current = next
  }

  for (const key of tracks.keys()) if (!seen.has(key)) tracks.delete(key)
  return out
}
