/**
 * Tailwind utility → React Native declarations.
 *
 * Utilities resolve against a ValueEnv so theme variables, CSS custom
 * properties set by other classes, and color modes all flow through the same
 * `var()` machinery Tailwind itself uses.
 */
import { decodeArbitrary, splitModifier } from "./parse"
import { evaluate, splitTopLevel, substituteVars, toColor, toDimension, type ValueEnv } from "./value"

type Style = Record<string, unknown>

/** Filter functions in the order Tailwind applies them. */
export const FILTERS = ["blur", "brightness", "contrast", "grayscale", "hueRotate", "invert", "saturate", "sepia"] as const
export type FilterName = (typeof FILTERS)[number]

/** One layer of a CSS shadow list. */
export interface ShadowLayer {
  inset: boolean
  x: number
  y: number
  blur: number
  spread: number
  color?: string
}

/** Which properties a `transition-*` class animates. */
export type TransitionGroup = "colors" | "opacity" | "transform" | "layout"

/** Values that are composed after all classes are applied. */
export interface Effects {
  shadow?: string
  shadowColor?: string
  insetShadow?: string
  insetShadowColor?: string
  ringWidth?: number
  ringColor?: string
  ringInset?: boolean
  insetRingWidth?: number
  insetRingColor?: string
  ringOffsetWidth?: number
  ringOffsetColor?: string
  translateX?: number | string
  translateY?: number | string
  rotate?: string
  scaleX?: number
  scaleY?: number
  rotateX?: string
  rotateY?: string
  rotateZ?: string
  skewX?: string
  skewY?: string
  /** `perspective-*`: applies to descendants' 3D transforms. `none` clears it. */
  perspective?: number | "none"
  /** Line height from a text-size utility, as a multiple of font size. */
  textLeading?: number
  /** Line height from leading-*, as a multiple (number) or px ({ px }). */
  leading?: number | { px: number }
  /** Letter spacing in em. */
  trackingEm?: number
  /** `filter` functions by name; `filter-none` clears them. */
  filters?: Partial<Record<FilterName, number | string>>
  /** Text shadow from `text-shadow-*` (null for `text-shadow-none`). */
  textShadow?: ShadowLayer | null
  textShadowColor?: string
  textShadowOpacity?: number
  /** CSS shadow list from `drop-shadow-*` (null for `drop-shadow-none`). */
  dropShadow?: string | null
  dropShadowColor?: string
  dropShadowOpacity?: number
  /** Gradient from `bg-linear-*`/`bg-radial-*`, or a full CSS gradient from `bg-[...]`. */
  gradient?: { kind: "linear" | "radial"; args: string } | { css: string } | null
  gradientFrom?: string
  gradientVia?: string
  gradientTo?: string
  gradientFromPos?: string
  gradientViaPos?: string
  gradientToPos?: string
  divideX?: number
  divideY?: number
  divideXReverse?: boolean
  divideYReverse?: boolean
  divideColor?: string
  divideStyle?: string
  /** `grid` / `inline-grid` display. */
  grid?: boolean
  gridCols?: number | null
  colSpan?: number | "full"
  transition?: TransitionGroup[] | "none"
  transitionDuration?: number
  transitionEasing?: [number, number, number, number] | "linear"
  transitionDelay?: number
}

export interface Decl {
  style?: Style
  props?: Record<string, unknown>
  /** Custom properties set by this class, unevaluated. */
  vars?: Record<string, string>
  fx?: Effects
  animation?: string
  /** Lower-priority styles, e.g. `flex` implying `flex-direction: row`. */
  defaults?: Style
}

export interface UtilityContext {
  env: ValueEnv
  negative: boolean
}

type Handler = (value: string, ctx: UtilityContext) => Decl | undefined

const theme = (env: ValueEnv, ns: string, key: string) => env.getVar(`${ns}-${key}`)
const neg = <T extends number | string | undefined>(v: T, ctx: UtilityContext): T => {
  if (!ctx.negative || v === undefined) return v
  if (typeof v === "number") return -v as T
  return (v.startsWith("-") ? v.slice(1) : `-${v}`) as T
}

// ---------------------------------------------------------------------------
// Value helpers
// ---------------------------------------------------------------------------

/** Spacing-scale values: `4`, `2.5`, `px`, `1/2`, `full`, `[10px]`, `(--x)`. */
function spacing(value: string, ctx: UtilityContext, extra?: Record<string, string>): number | string | undefined {
  const { env } = ctx
  if (extra && value in extra) return dimension(extra[value], env)
  if (value === "px") return 1
  if (value === "0") return 0
  if (value === "lh") return dimension("1lh", env)
  if (value === "full") return "100%"
  if (value === "auto") return "auto"
  if (/^\d+\/\d+$/.test(value)) {
    const [a, b] = value.split("/").map(Number)
    return `${(a / b) * 100}%`
  }
  if (/^\d+(\.\d+)?$/.test(value)) {
    const unit = toDimension("var(--spacing)", env)
    return typeof unit === "number" ? unit * parseFloat(value) : undefined
  }
  const arb = decodeArbitrary(value)
  if (arb !== undefined) return dimension(arb, env)
  return undefined
}

function dimension(css: string, env: ValueEnv): number | string | undefined {
  if (css === "auto") return "auto"
  return toDimension(css, env)
}

function opacityOf(modifier: string | undefined, env: ValueEnv): number {
  if (modifier === undefined) return 1
  if (/^\d+(\.\d+)?$/.test(modifier)) return parseFloat(modifier) / 100
  const arb = decodeArbitrary(modifier)
  if (arb !== undefined) {
    const v = evaluate(arb, env)
    if (v?.kind === "percent") return v.value / 100
    if (v?.kind === "number") return v.value
  }
  return 1
}

/** Resolves a color utility value (`primary`, `red-500`, `[#fff]`, `(--x)`) with opacity. */
function color(value: string, ctx: UtilityContext, modifier?: string): string | undefined {
  const { env } = ctx
  const opacity = opacityOf(modifier, env)
  if (value === "inherit" || value === "current") return undefined
  if (value === "transparent") return "rgba(0, 0, 0, 0)"
  const arb = decodeArbitrary(value)
  if (arb !== undefined) return toColor(arb, env, opacity)
  const themed = theme(env, "color", value)
  if (themed !== undefined) return toColor(themed, env, opacity)
  return undefined
}

function isColor(value: string, ctx: UtilityContext): boolean {
  const [v] = splitModifier(value)
  if (v === "inherit" || v === "current" || v === "transparent") return true
  if (ctx.env.getVar(`color-${v}`) !== undefined) return true
  const arb = decodeArbitrary(v)
  if (arb === undefined) return false
  if (/^\[color:/.test(v)) return true
  if (/^\[(length|number|percentage):/.test(v)) return false
  return evaluate(arb, ctx.env)?.kind === "color"
}

/** Placeholder for `currentColor`; resolve() swaps in the element's text color. */
export const CURRENT_COLOR = "currentColor"

function withColor(value: string, ctx: UtilityContext, fn: (c: string) => Decl): Decl | undefined {
  const [v, mod] = splitModifier(value)
  const c = color(v, ctx, mod)
  if (v === "inherit") return { style: {} }
  // Resolved against the element's text color once all its classes are applied.
  if (v === "current") return fn(CURRENT_COLOR)
  return c === undefined ? undefined : fn(c)
}

function lengthOrTheme(value: string, ctx: UtilityContext, ns: string): number | string | undefined {
  const t = theme(ctx.env, ns, value)
  if (t !== undefined) return dimension(t, ctx.env)
  const arb = decodeArbitrary(value)
  if (arb !== undefined) return dimension(arb, ctx.env)
  return undefined
}

/** Resolves shadow theme values or arbitrary shadows into an RN boxShadow string. */
function shadowValue(value: string, ctx: UtilityContext, ns: string): string | undefined {
  // Bare `shadow` is v3 syntax for what v4 calls `shadow-sm`.
  const raw = value === "" ? ctx.env.getVar(ns) ?? theme(ctx.env, ns, "sm") : theme(ctx.env, ns, value)
  const css = raw ?? decodeArbitrary(value)
  if (css === undefined) return undefined
  if (css === "none" || css === "0 0 #0000") return "none"
  return normalizeShadow(css, ctx.env)
}

/** Converts colors and lengths inside a CSS shadow list to RN-compatible values. */
export function normalizeShadow(css: string, env: ValueEnv, colorOverride?: string): string {
  const layers: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i <= css.length; i++) {
    const c = css[i]
    if (c === "(") depth++
    else if (c === ")") depth--
    if ((c === "," && depth === 0) || i === css.length) {
      layers.push(css.slice(start, i).trim())
      start = i + 1
    }
  }
  return layers
    .map((layer) => {
      const tokens: string[] = []
      let d = 0
      let s = 0
      for (let i = 0; i <= layer.length; i++) {
        const c = layer[i]
        if (c === "(") d++
        else if (c === ")") d--
        if ((c === " " && d === 0) || i === layer.length) {
          if (i > s) tokens.push(layer.slice(s, i))
          s = i + 1
        }
      }
      return tokens
        .map((t) => {
          if (t === "inset") return t
          const v = evaluate(t, env)
          if (v?.kind === "color") return colorOverride ?? v.value
          if (v?.kind === "length") return `${v.px}px`
          if (v?.kind === "number") return `${v.value}px`
          return t
        })
        .join(" ")
    })
    .join(", ")
}

/** Splits a CSS list on top-level whitespace. */
function words(s: string): string[] {
  const out: string[] = []
  let d = 0
  let start = 0
  for (let i = 0; i <= s.length; i++) {
    const c = s[i]
    if (c === "(") d++
    else if (c === ")") d--
    if ((c === " " && d === 0) || i === s.length) {
      if (i > start) out.push(s.slice(start, i))
      start = i + 1
    }
  }
  return out
}

/** Parses a CSS shadow list (`0 1px 2px rgb(0 0 0 / 0.1), inset 0 0 0 1px red`). */
export function parseShadowLayers(css: string, env: ValueEnv): ShadowLayer[] {
  const layers: ShadowLayer[] = []
  for (const layer of splitTopLevel(css, ",")) {
    const lengths: number[] = []
    let inset = false
    let color: string | undefined
    for (const t of words(layer.trim())) {
      if (t === "inset") {
        inset = true
        continue
      }
      const v = evaluate(t, env)
      if (v?.kind === "color") color = v.value
      else if (v?.kind === "length") lengths.push(v.px)
      else if (v?.kind === "number") lengths.push(v.value)
    }
    if (lengths.length < 2) continue
    const [x, y, blur = 0, spread = 0] = lengths
    layers.push({ inset, x, y, blur, spread, color })
  }
  return layers
}

/**
 * Collapses a shadow list into the single shadow React Native text and iOS
 * layer shadows support: the largest layer's geometry, with the layers'
 * combined coverage as its alpha.
 */
export function collapseShadow(layers: ShadowLayer[]): ShadowLayer | undefined {
  if (!layers.length) return undefined
  const main = layers.reduce((a, b) => (b.blur + Math.abs(b.y) >= a.blur + Math.abs(a.y) ? b : a))
  let clear = 1
  let rgb: number[] | undefined
  for (const l of layers) {
    const m = l.color && /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(l.color)
    if (!m) continue
    rgb ??= [Number(m[1]), Number(m[2]), Number(m[3])]
    clear *= 1 - Number(m[4])
  }
  const alpha = Math.round((1 - clear) * 1000) / 1000
  return { ...main, color: rgb ? `rgba(${rgb.join(", ")}, ${alpha})` : main.color }
}

/** Converts every color inside a CSS value (e.g. a gradient) to a React Native color. */
export function nativeColorsIn(css: string, env: ValueEnv): string {
  let out = ""
  let i = 0
  const fn = /(oklch|oklab|rgba?|hsla?|color-mix|var)\(|#[0-9a-fA-F]{3,8}\b/g
  for (let m = fn.exec(css); m; m = fn.exec(css)) {
    let end = m.index + m[0].length
    if (m[1]) {
      let depth = 1
      while (end < css.length && depth > 0) {
        if (css[end] === "(") depth++
        else if (css[end] === ")") depth--
        end++
      }
    }
    const token = css.slice(m.index, end)
    const v = evaluate(token, env)
    out += css.slice(i, m.index) + (v?.kind === "color" ? v.value : v?.kind === "length" ? `${v.px}px` : token)
    i = end
    fn.lastIndex = end
  }
  return out + css.slice(i)
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

const boxEdges = {
  "": [""],
  x: ["Horizontal"],
  y: ["Vertical"],
  t: ["Top"],
  r: ["Right"],
  b: ["Bottom"],
  l: ["Left"],
  s: ["Start"],
  e: ["End"],
  // Logical block sides; horizontal writing mode maps them to top/bottom.
  bs: ["Top"],
  be: ["Bottom"],
} as const

function edge(prop: "padding" | "margin", sides: readonly string[]): Handler {
  return (value, ctx) => {
    const v = neg(spacing(value, ctx), ctx)
    if (v === undefined) return undefined
    return { style: Object.fromEntries(sides.map((s) => [`${prop}${s}`, v])) }
  }
}

const insetSides: Record<string, string[]> = {
  inset: ["top", "right", "bottom", "left"],
  "inset-x": ["left", "right"],
  "inset-y": ["top", "bottom"],
  "inset-s": ["start"],
  "inset-e": ["end"],
  "inset-bs": ["top"],
  "inset-be": ["bottom"],
  top: ["top"],
  right: ["right"],
  bottom: ["bottom"],
  left: ["left"],
  start: ["start"],
  end: ["end"],
}

function size(props: string[], extra?: (ctx: UtilityContext) => Record<string, string>): Handler {
  return (full, ctx) => {
    const special: Record<string, string> = {
      screen: props.some((p) => /[Hh]eight/.test(p)) ? "100vh" : "100vw",
      dvh: "100vh",
      svh: "100vh",
      lvh: "100vh",
      dvw: "100vw",
      svw: "100vw",
      lvw: "100vw",
      ...(extra?.(ctx) ?? {}),
    }
    // Intrinsic sizes: React Native (Yoga 3, New Architecture) supports `fit-content` and
    // `max-content`, but not `min-content` (left as auto). Without them an item in a stretching
    // column fills its width, where `w-fit` shrinks it to its content.
    const intrinsic: Record<string, string | undefined> = {
      fit: "fit-content",
      max: "max-content",
      min: undefined,
      none: undefined,
    }
    if (full in intrinsic) {
      return { style: Object.fromEntries(props.map((p) => [p, intrinsic[full]])) }
    }
    const v = spacing(full, ctx, special)
    if (v === undefined) return undefined
    return { style: Object.fromEntries(props.map((p) => [p, v])) }
  }
}

const containerSizes = (ctx: UtilityContext): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const k of ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"]) {
    const v = ctx.env.getVar(`container-${k}`)
    if (v) out[k] = v
  }
  return out
}

const radiusCorners: Record<string, string[]> = {
  "": ["borderRadius"],
  t: ["borderTopLeftRadius", "borderTopRightRadius"],
  r: ["borderTopRightRadius", "borderBottomRightRadius"],
  b: ["borderBottomLeftRadius", "borderBottomRightRadius"],
  l: ["borderTopLeftRadius", "borderBottomLeftRadius"],
  s: ["borderTopStartRadius", "borderBottomStartRadius"],
  e: ["borderTopEndRadius", "borderBottomEndRadius"],
  tl: ["borderTopLeftRadius"],
  tr: ["borderTopRightRadius"],
  br: ["borderBottomRightRadius"],
  bl: ["borderBottomLeftRadius"],
  ss: ["borderTopStartRadius"],
  se: ["borderTopEndRadius"],
  es: ["borderBottomStartRadius"],
  ee: ["borderBottomEndRadius"],
}

function radius(corners: string[]): Handler {
  return (value, ctx) => {
    let v: number | string | undefined
    if (value === "" || value === "DEFAULT") v = lengthOrTheme("DEFAULT", ctx, "radius") ?? 4
    else if (value === "none") v = 0
    else if (value === "full") v = 9999
    else v = lengthOrTheme(value, ctx, "radius")
    if (v === undefined) return undefined
    return { style: Object.fromEntries(corners.map((c) => [c, v])) }
  }
}

const borderSides: Record<string, string[]> = {
  "": [""],
  x: ["Left", "Right"],
  y: ["Top", "Bottom"],
  t: ["Top"],
  r: ["Right"],
  b: ["Bottom"],
  l: ["Left"],
  s: ["Start"],
  e: ["End"],
  bs: ["Top"],
  be: ["Bottom"],
}

function border(sides: string[]): Handler {
  return (value, ctx) => {
    if (value === "" || /^\d+$/.test(value) || /^\[(length:)?[\d.]+px\]$/.test(value) || value.startsWith("(length:")) {
      const w = value === "" ? 1 : /^\d+$/.test(value) ? Number(value) : dimension(decodeArbitrary(value)!, ctx.env)
      return { style: Object.fromEntries(sides.map((s) => [`border${s}Width`, w])) }
    }
    if (["solid", "dashed", "dotted"].includes(value) && sides[0] === "") return { style: { borderStyle: value } }
    if (value === "none" && sides[0] === "") return { style: { borderWidth: 0 } }
    if (value === "hidden" && sides[0] === "") return { style: { borderWidth: 0 } }
    if (isColor(value, ctx)) {
      return withColor(value, ctx, (c) => ({
        style: Object.fromEntries(sides.map((s) => [`border${s}Color`, c])),
      }))
    }
    const arb = decodeArbitrary(value)
    if (arb !== undefined) {
      const w = dimension(arb, ctx.env)
      if (typeof w === "number") return { style: Object.fromEntries(sides.map((s) => [`border${s}Width`, w])) }
    }
    return undefined
  }
}

function fontSize(value: string, ctx: UtilityContext, modifier: string | undefined): Decl | undefined {
  const { env } = ctx
  const t = theme(env, "text", value)
  const css = t ?? decodeArbitrary(value)
  if (css === undefined) return undefined
  if (t === undefined && /^\[(color|#|rgb|oklch|hsl)/.test(value)) return undefined
  const px = toDimension(css, env)
  if (typeof px !== "number") return undefined
  const fx: Effects = {}
  if (modifier !== undefined) {
    const lh = leadingValue(modifier, ctx)
    if (lh !== undefined) fx.leading = lh
  } else if (t !== undefined) {
    const ratio = env.getVar(`text-${value}--line-height`)
    const v = ratio ? evaluate(ratio, env) : undefined
    if (v?.kind === "number") fx.textLeading = v.value
    else if (v?.kind === "length") fx.leading = { px: v.px }
  }
  return { style: { fontSize: px }, fx }
}

function leadingValue(value: string, ctx: UtilityContext): Effects["leading"] {
  if (value === "none") return 1
  if (value === "px") return { px: 1 }
  const t = theme(ctx.env, "leading", value)
  if (t !== undefined) {
    const v = evaluate(t, ctx.env)
    return v?.kind === "number" ? v.value : v?.kind === "length" ? { px: v.px } : undefined
  }
  if (/^\d+(\.\d+)?$/.test(value)) {
    const s = spacing(value, ctx)
    return typeof s === "number" ? { px: s } : undefined
  }
  const arb = decodeArbitrary(value)
  if (arb !== undefined) {
    const v = evaluate(arb, ctx.env)
    return v?.kind === "number" ? v.value : v?.kind === "length" ? { px: v.px } : undefined
  }
  return undefined
}

function transformHandler(key: "translateX" | "translateY" | "both"): Handler {
  return (full, ctx) => {
    const v = neg(spacing(full, ctx), ctx)
    if (v === undefined || v === "auto") return undefined
    if (key === "both") return { fx: { translateX: v, translateY: v } }
    return { fx: { [key]: v } }
  }
}

function angle(value: string, ctx: UtilityContext): string | undefined {
  if (/^\d+(\.\d+)?$/.test(value)) return `${ctx.negative ? "-" : ""}${value}deg`
  const arb = decodeArbitrary(value)
  if (arb !== undefined && /^-?[\d.]+(deg|rad|turn)$/.test(arb)) return ctx.negative ? `-${arb}` : arb
  return undefined
}

function scaleValue(value: string, ctx: UtilityContext): number | undefined {
  if (/^\d+$/.test(value)) return neg(Number(value) / 100, ctx)
  const arb = decodeArbitrary(value)
  if (arb === undefined) return undefined
  const v = evaluate(arb, ctx.env)
  if (v?.kind === "number") return neg(v.value, ctx)
  if (v?.kind === "percent") return neg(v.value / 100, ctx)
  return undefined
}

/** `filter` functions: `blur-sm`, `contrast-125`, `hue-rotate-90`, `invert`, `sepia-[.5]`. */
function filterHandler(name: FilterName): Handler {
  return (v, ctx) => {
    let value: number | string | undefined
    if (name === "blur") {
      const t = v === "" ? ctx.env.getVar("blur") ?? "8px" : v === "none" ? "0px" : theme(ctx.env, "blur", v) ?? decodeArbitrary(v)
      const px = t !== undefined ? toDimension(t, ctx.env) : undefined
      value = typeof px === "number" ? px : undefined
    } else if (name === "hueRotate") {
      value = angle(v, ctx)
    } else if (v === "" && (name === "grayscale" || name === "invert" || name === "sepia")) {
      value = 1
    } else if (/^\d+$/.test(v)) {
      value = Number(v) / 100
    } else {
      const arb = decodeArbitrary(v)
      const e = arb !== undefined ? evaluate(arb, ctx.env) : undefined
      value = e?.kind === "number" ? e.value : e?.kind === "percent" ? e.value / 100 : undefined
    }
    return value === undefined ? undefined : { fx: { filters: { [name]: value } } }
  }
}

/** `text-shadow-*` and `drop-shadow-*`: a theme size (with `/opacity`), a color, or an arbitrary shadow. */
function shadowFamily(ns: "text-shadow" | "drop-shadow"): Handler {
  return (v, ctx) => {
    const [base, mod] = splitModifier(v)
    const themed = base === "" ? ctx.env.getVar(ns) : theme(ctx.env, ns, base)
    const arb = themed === undefined && !isColor(v, ctx) ? decodeArbitrary(base) : undefined
    const css = themed ?? arb
    const opacity = mod !== undefined ? opacityOf(mod, ctx.env) : undefined
    if (css !== undefined) {
      if (ns === "drop-shadow") return { fx: { dropShadow: css, dropShadowOpacity: opacity } }
      const layer = collapseShadow(parseShadowLayers(css, ctx.env))
      return layer ? { fx: { textShadow: layer, textShadowOpacity: opacity } } : undefined
    }
    return withColor(v, ctx, (c) => ({ fx: ns === "drop-shadow" ? { dropShadowColor: c } : { textShadowColor: c } }))
  }
}

const GRADIENT_SIDES: Record<string, string> = {
  t: "to top",
  tr: "to top right",
  r: "to right",
  br: "to bottom right",
  b: "to bottom",
  bl: "to bottom left",
  l: "to left",
  tl: "to top left",
}

/** `bg-linear-to-r`, `bg-linear-45`, `bg-linear-[25deg,red_5%,blue]`, `bg-gradient-to-r` (v3). */
function linearGradient(v: string, ctx: UtilityContext): Decl | undefined {
  const [base] = splitModifier(v) // `/oklch`-style interpolation modifiers don't apply natively.
  if (base.startsWith("to-") && GRADIENT_SIDES[base.slice(3)]) {
    return { fx: { gradient: { kind: "linear", args: GRADIENT_SIDES[base.slice(3)] } } }
  }
  if (/^\d+$/.test(base)) return { fx: { gradient: { kind: "linear", args: `${ctx.negative ? "-" : ""}${base}deg` } } }
  const arb = decodeArbitrary(base)
  if (arb === undefined) return undefined
  if (splitTopLevel(arb, ",").length > 1) return { fx: { gradient: { css: `linear-gradient(${arb})` } } }
  return { fx: { gradient: { kind: "linear", args: arb } } }
}

/** `from-*`, `via-*`, `to-*`: a color or a stop position. */
function gradientStop(which: "From" | "Via" | "To"): Handler {
  return (v, ctx) => {
    const pos = /^\d+(\.\d+)?%$/.test(v) ? v : undefined
    if (pos) return { fx: { [`gradient${which}Pos`]: pos } }
    const arb = decodeArbitrary(v)
    if (arb !== undefined && !isColor(v, ctx)) {
      const d = evaluate(arb, ctx.env)
      if (d?.kind === "percent") return { fx: { [`gradient${which}Pos`]: `${d.value}%` } }
      if (d?.kind === "length") return { fx: { [`gradient${which}Pos`]: `${d.px}px` } }
    }
    return withColor(v, ctx, (c) => ({ fx: { [`gradient${which}`]: c } }))
  }
}

/** `divide-x`, `divide-x-2`, `divide-y-[3px]`. */
function divideWidth(axis: "X" | "Y"): Handler {
  return (v, ctx) => {
    const w = v === "" ? 1 : /^\d+$/.test(v) ? Number(v) : dimension(decodeArbitrary(v) ?? "", ctx.env)
    return typeof w === "number" ? { fx: { [`divide${axis}`]: w } } : undefined
  }
}

const TRANSITIONS: Record<string, TransitionGroup[] | "none"> = {
  "": ["colors", "opacity", "transform"],
  all: ["colors", "opacity", "transform", "layout"],
  colors: ["colors"],
  opacity: ["opacity"],
  transform: ["transform"],
  shadow: [],
  none: "none",
}

/** Maps `transition-[color,opacity]` CSS properties to the groups AstraWind animates. */
function transitionProperties(css: string): TransitionGroup[] {
  const groups = new Set<TransitionGroup>()
  for (const raw of css.split(",")) {
    const p = raw.trim()
    if (p === "all") return TRANSITIONS.all as TransitionGroup[]
    if (/color|fill|stroke/.test(p)) groups.add("colors")
    else if (p === "opacity") groups.add("opacity")
    else if (/^(transform|translate|rotate|scale)$/.test(p)) groups.add("transform")
    else if (/^(width|height|min-|max-|margin|padding|inset|top|left|right|bottom|gap|border-radius|border-width|flex-basis)/.test(p))
      groups.add("layout")
  }
  return [...groups]
}

function timeMs(v: string, ctx: UtilityContext): number | undefined {
  if (/^\d+$/.test(v)) return Number(v)
  const arb = decodeArbitrary(v)
  const e = arb !== undefined ? evaluate(arb, ctx.env) : undefined
  return e?.kind === "number" ? e.value : undefined
}

function bezier(css: string): [number, number, number, number] | "linear" | undefined {
  if (css.trim() === "linear") return "linear"
  const m = /^cubic-bezier\(([^)]+)\)$/.exec(css.trim())
  if (!m) return undefined
  const n = m[1].split(",").map((x) => parseFloat(x))
  return n.length === 4 && n.every(Number.isFinite) ? (n as [number, number, number, number]) : undefined
}

/** `grid-cols-3`, `grid-cols-[repeat(3,minmax(0,1fr))]`. Other templates aren't emulated. */
function gridColumns(v: string): number | null | undefined {
  if (/^\d+$/.test(v)) return Number(v)
  if (v === "none" || v === "subgrid") return null
  const arb = decodeArbitrary(v)
  const m = arb && /^repeat\(\s*(\d+)\s*,/.exec(arb)
  if (m) return Number(m[1])
  if (arb && /^(\S+\s*)+$/.test(arb) && arb.split(/\s+/).every((t) => /^(1fr|minmax\(0,\s*1fr\))$/.test(t))) {
    return arb.split(/\s+/).length
  }
  return undefined
}

const noop: Handler = () => ({ style: {} })

const fontWeights: Record<string, string> = {
  thin: "100",
  extralight: "200",
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
}

// Static utilities: exact class → decl.
const STATIC: Record<string, Decl> = {
  // Display
  flex: { style: { display: "flex" }, defaults: { flexDirection: "row" } },
  "inline-flex": { style: { display: "flex" }, defaults: { flexDirection: "row", alignSelf: "flex-start" } },
  block: { style: { display: "flex" } },
  "inline-block": { style: { display: "flex" } },
  inline: { style: { display: "flex" } },
  // Grids are emulated with flex rows; see `grid-cols-*`.
  grid: { style: { display: "flex" }, fx: { grid: true } },
  "inline-grid": { style: { display: "flex" }, fx: { grid: true } },
  contents: { style: { display: "contents" } },
  "flow-root": { style: { display: "flex" } },
  "list-item": { style: { display: "flex" } },
  // Tables have no native layout; rows lay their cells out in a line.
  table: { style: { display: "flex" } },
  "inline-table": { style: { display: "flex" } },
  "table-caption": { style: { display: "flex" } },
  "table-header-group": { style: { display: "flex" } },
  "table-row-group": { style: { display: "flex" } },
  "table-footer-group": { style: { display: "flex" } },
  "table-row": { style: { display: "flex" }, defaults: { flexDirection: "row" } },
  "table-cell": { style: { display: "flex" } },
  "table-column": { style: { display: "none" } },
  "table-column-group": { style: { display: "none" } },
  hidden: { style: { display: "none" } },
  // Position
  static: { style: { position: "static" } },
  relative: { style: { position: "relative" } },
  absolute: { style: { position: "absolute" } },
  fixed: { style: { position: "absolute" } },
  sticky: { style: { position: "relative" } },
  // Overflow
  "overflow-hidden": { style: { overflow: "hidden" } },
  "overflow-clip": { style: { overflow: "hidden" } },
  "overflow-visible": { style: { overflow: "visible" } },
  "overflow-scroll": { style: { overflow: "scroll" } },
  "overflow-auto": { style: { overflow: "scroll" } },
  "overflow-x-hidden": { style: { overflow: "hidden" } },
  "overflow-y-hidden": { style: { overflow: "hidden" } },
  "overflow-x-auto": { style: {} },
  "overflow-y-auto": { style: {} },
  "overflow-x-scroll": { style: {} },
  "overflow-y-scroll": { style: {} },
  // React Native has a single overflow for both axes.
  "overflow-x-clip": { style: { overflow: "hidden" } },
  "overflow-y-clip": { style: { overflow: "hidden" } },
  "overflow-x-visible": { style: {} },
  "overflow-y-visible": { style: {} },
  // Flex
  "flex-row": { style: { flexDirection: "row" } },
  "flex-row-reverse": { style: { flexDirection: "row-reverse" } },
  "flex-col": { style: { flexDirection: "column" } },
  "flex-col-reverse": { style: { flexDirection: "column-reverse" } },
  // CSS's align-content defaults to `normal` (stretch) for wrapping containers; Yoga's default is
  // flex-start, which shrinks lines to their content. Low-priority so `content-*` still wins.
  "flex-wrap": { style: { flexWrap: "wrap" }, defaults: { alignContent: "stretch" } },
  "flex-wrap-reverse": { style: { flexWrap: "wrap-reverse" }, defaults: { alignContent: "stretch" } },
  "flex-nowrap": { style: { flexWrap: "nowrap" } },
  "flex-auto": { style: { flexGrow: 1, flexShrink: 1, flexBasis: "auto" } },
  "flex-initial": { style: { flexGrow: 0, flexShrink: 1, flexBasis: "auto" } },
  "flex-none": { style: { flexGrow: 0, flexShrink: 0, flexBasis: "auto" } },
  grow: { style: { flexGrow: 1 } },
  shrink: { style: { flexShrink: 1 } },
  // Alignment
  "items-start": { style: { alignItems: "flex-start" } },
  "items-end": { style: { alignItems: "flex-end" } },
  "items-center": { style: { alignItems: "center" } },
  "items-baseline": { style: { alignItems: "baseline" } },
  "items-stretch": { style: { alignItems: "stretch" } },
  // Yoga has no overflow-safe alignment or last-baseline; these use the plain value.
  "items-center-safe": { style: { alignItems: "center" } },
  "items-end-safe": { style: { alignItems: "flex-end" } },
  "items-baseline-last": { style: { alignItems: "baseline" } },
  "self-center-safe": { style: { alignSelf: "center" } },
  "self-end-safe": { style: { alignSelf: "flex-end" } },
  "self-baseline-last": { style: { alignSelf: "baseline" } },
  "justify-center-safe": { style: { justifyContent: "center" } },
  "justify-end-safe": { style: { justifyContent: "flex-end" } },
  "justify-baseline": { style: {} },
  "justify-start": { style: { justifyContent: "flex-start" } },
  "justify-end": { style: { justifyContent: "flex-end" } },
  "justify-center": { style: { justifyContent: "center" } },
  "justify-between": { style: { justifyContent: "space-between" } },
  "justify-around": { style: { justifyContent: "space-around" } },
  "justify-evenly": { style: { justifyContent: "space-evenly" } },
  "justify-stretch": { style: {} },
  "justify-normal": { style: {} },
  "self-auto": { style: { alignSelf: "auto" } },
  "self-start": { style: { alignSelf: "flex-start" } },
  "self-end": { style: { alignSelf: "flex-end" } },
  "self-center": { style: { alignSelf: "center" } },
  "self-stretch": { style: { alignSelf: "stretch" } },
  "self-baseline": { style: { alignSelf: "baseline" } },
  "content-start": { style: { alignContent: "flex-start" } },
  "content-end": { style: { alignContent: "flex-end" } },
  "content-center": { style: { alignContent: "center" } },
  "content-between": { style: { alignContent: "space-between" } },
  "content-around": { style: { alignContent: "space-around" } },
  "content-evenly": { style: { alignContent: "space-evenly" } },
  "content-stretch": { style: { alignContent: "stretch" } },
  "place-items-center": { style: { alignItems: "center", justifyContent: "center" } },
  "place-content-center": { style: { alignContent: "center", justifyContent: "center" } },
  "place-self-center": { style: { alignSelf: "center" } },
  // Typography
  italic: { style: { fontStyle: "italic" } },
  "not-italic": { style: { fontStyle: "normal" } },
  underline: { style: { textDecorationLine: "underline" } },
  "line-through": { style: { textDecorationLine: "line-through" } },
  "no-underline": { style: { textDecorationLine: "none" } },
  overline: { style: {} },
  uppercase: { style: { textTransform: "uppercase" } },
  lowercase: { style: { textTransform: "lowercase" } },
  capitalize: { style: { textTransform: "capitalize" } },
  "normal-case": { style: { textTransform: "none" } },
  "text-left": { style: { textAlign: "left" } },
  "text-center": { style: { textAlign: "center" } },
  "text-right": { style: { textAlign: "right" } },
  "text-justify": { style: { textAlign: "justify" } },
  "text-start": { style: { textAlign: "left" } },
  "text-end": { style: { textAlign: "right" } },
  truncate: { props: { numberOfLines: 1, ellipsizeMode: "tail" } },
  "text-ellipsis": { props: { ellipsizeMode: "tail" } },
  "text-clip": { props: { ellipsizeMode: "clip" } },
  "line-clamp-none": { props: { numberOfLines: 0 } },
  "tabular-nums": { style: { fontVariant: ["tabular-nums"] } },
  "oldstyle-nums": { style: { fontVariant: ["oldstyle-nums"] } },
  "lining-nums": { style: { fontVariant: ["lining-nums"] } },
  "proportional-nums": { style: { fontVariant: ["proportional-nums"] } },
  "normal-nums": { style: { fontVariant: [] } },
  "align-top": { style: { verticalAlign: "top" } },
  "align-middle": { style: { verticalAlign: "middle" } },
  "align-bottom": { style: { verticalAlign: "bottom" } },
  // Borders & outlines
  "outline-none": { style: { outlineWidth: 0 } },
  "outline-hidden": { style: { outlineWidth: 0 } },
  "outline-solid": { style: { outlineStyle: "solid" } },
  "outline-dashed": { style: { outlineStyle: "dashed" } },
  "outline-dotted": { style: { outlineStyle: "dotted" } },
  // React Native has no double outline; solid is the closest.
  "outline-double": { style: { outlineStyle: "solid" } },
  outline: { style: { outlineWidth: 1, outlineStyle: "solid" } },
  "ring-inset": { fx: { ringInset: true } },
  // Interactivity
  "pointer-events-none": { style: { pointerEvents: "none" } },
  "pointer-events-auto": { style: { pointerEvents: "auto" } },
  "select-none": { style: { userSelect: "none" }, props: { selectable: false } },
  "select-text": { style: { userSelect: "text" }, props: { selectable: true } },
  "select-all": { style: { userSelect: "all" }, props: { selectable: true } },
  "select-auto": { style: { userSelect: "auto" } },
  "cursor-pointer": { style: { cursor: "pointer" } },
  "cursor-default": { style: { cursor: "auto" } },
  "cursor-auto": { style: { cursor: "auto" } },
  invisible: { style: { opacity: 0 }, props: { pointerEvents: "none" } },
  collapse: { style: { opacity: 0 }, props: { pointerEvents: "none" } },
  visible: { style: {} },
  "sr-only": {
    style: { position: "absolute", width: 1, height: 1, margin: -1, padding: 0, overflow: "hidden", opacity: 0 },
  },
  "not-sr-only": { style: { position: "static", width: "auto", height: "auto", margin: 0, overflow: "visible", opacity: 1 } },
  "no-scrollbar": { props: { showsVerticalScrollIndicator: false, showsHorizontalScrollIndicator: false } },
  // Images
  "object-cover": { style: { objectFit: "cover" } },
  "object-contain": { style: { objectFit: "contain" } },
  "object-fill": { style: { objectFit: "fill" } },
  "object-none": { style: { objectFit: "none" } },
  "object-scale-down": { style: { objectFit: "scale-down" } },
  // Backface / misc
  "backface-hidden": { style: { backfaceVisibility: "hidden" } },
  "backface-visible": { style: { backfaceVisibility: "visible" } },
  isolate: { style: { isolation: "isolate" } },
  "isolation-auto": { style: {} },
  "shadow-none": { fx: { shadow: "none" } },
  "shadow-initial": { fx: { shadowColor: undefined } },
  "inset-shadow-none": { fx: { insetShadow: "none" } },
  "inset-shadow-initial": { fx: { insetShadowColor: undefined } },
  "text-shadow-none": { fx: { textShadow: null } },
  "text-shadow-initial": { fx: { textShadowColor: undefined } },
  "drop-shadow-none": { fx: { dropShadow: null } },
  "drop-shadow-initial": { fx: { dropShadowColor: undefined } },
  "transform-none": {
    fx: { rotateX: undefined, rotateY: undefined, rotateZ: undefined, skewX: undefined, skewY: undefined },
  },
  "translate-none": { fx: { translateX: undefined, translateY: undefined } },
  "rotate-none": { fx: { rotate: undefined } },
  "scale-none": { fx: { scaleX: undefined, scaleY: undefined } },
  "filter-none": { fx: { filters: undefined } },
  "bg-none": { fx: { gradient: null } },
  "via-none": { fx: { gradientVia: undefined } },
  "border-double": { style: { borderStyle: "solid" } },
  "divide-x-reverse": { fx: { divideXReverse: true } },
  "divide-y-reverse": { fx: { divideYReverse: true } },
  // Mix blend
  "mix-blend-multiply": { style: { mixBlendMode: "multiply" } },
  "mix-blend-screen": { style: { mixBlendMode: "screen" } },
  "mix-blend-overlay": { style: { mixBlendMode: "overlay" } },
  "mix-blend-normal": { style: { mixBlendMode: "normal" } },
  "mix-blend-darken": { style: { mixBlendMode: "darken" } },
  "mix-blend-lighten": { style: { mixBlendMode: "lighten" } },
  "mix-blend-difference": { style: { mixBlendMode: "difference" } },
  "mix-blend-exclusion": { style: { mixBlendMode: "exclusion" } },
  "mix-blend-luminosity": { style: { mixBlendMode: "luminosity" } },
  "mix-blend-color": { style: { mixBlendMode: "color" } },
  "mix-blend-hue": { style: { mixBlendMode: "hue" } },
  "mix-blend-saturation": { style: { mixBlendMode: "saturation" } },
  "mix-blend-color-dodge": { style: { mixBlendMode: "color-dodge" } },
  "mix-blend-color-burn": { style: { mixBlendMode: "color-burn" } },
  "mix-blend-hard-light": { style: { mixBlendMode: "hard-light" } },
  "mix-blend-soft-light": { style: { mixBlendMode: "soft-light" } },
  "mix-blend-plus-lighter": { style: { mixBlendMode: "plus-lighter" } },
}

/** Web-only utilities with no native equivalent. They resolve to nothing, silently. */
const NOOP = new Set([
  "antialiased",
  "subpixel-antialiased",
  "bg-clip-padding",
  "bg-clip-border",
  "bg-clip-content",
  "bg-clip-text",
  "box-border",
  "box-content",
  "whitespace-nowrap",
  "whitespace-normal",
  "whitespace-pre",
  "whitespace-pre-line",
  "whitespace-pre-wrap",
  "whitespace-break-spaces",
  "text-wrap",
  "text-nowrap",
  "text-balance",
  "text-pretty",
  "break-words",
  "break-all",
  "break-normal",
  "break-keep",
  "wrap-break-word",
  "wrap-anywhere",
  "wrap-normal",
  "container",
  "touch-none",
  "touch-auto",
  "touch-manipulation",
  "touch-pan-x",
  "touch-pan-y",
  "resize",
  "resize-none",
  "resize-x",
  "resize-y",
  "appearance-none",
  "appearance-auto",
  "field-sizing-content",
  "field-sizing-fixed",
  "scroll-smooth",
  "scroll-auto",
  "scroll-my-1",
  "snap-x",
  "snap-y",
  "snap-start",
  "snap-center",
  "snap-end",
  "snap-mandatory",
  "snap-proximity",
  "overscroll-contain",
  "overscroll-none",
  "overscroll-auto",
  "list-none",
  "list-disc",
  "list-decimal",
  "list-inside",
  "list-outside",
  "table-auto",
  "table-fixed",
  "border-collapse",
  "border-separate",
  "caption-bottom",
  "caption-top",
  "will-change-transform",
  "will-change-auto",
  "transform-gpu",
  "transform-cpu",
  "outline-offset-0",
  "scroll-fade",
  "scroll-fade-x",
  "scroll-fade-y",
  "scroll-fade-none",
  "shimmer",
  "shimmer-none",
  "forced-color-adjust-none",
  "origin-center",
  "bg-fixed",
  "bg-local",
  "bg-scroll",
  "bg-no-repeat",
  "bg-repeat",
  "bg-cover",
  "bg-contain",
  "bg-center",
  "decoration-clone",
  "decoration-slice",
  "hyphens-auto",
  "hyphens-none",
  "hyphens-manual",
  "font-stretch-normal",
  "fill-none",
  "stroke-none",
  "sr",
  // Individual transform properties need no opt-in on native.
  "transform",
  "transform-3d",
  "transform-flat",
  "scale-3d",
  "translate-3d",
  "bg-auto",
  "bg-repeat-x",
  "bg-repeat-y",
  "bg-repeat-round",
  "bg-repeat-space",
  "bg-bottom",
  "bg-left",
  "bg-right",
  "bg-top",
  "bg-top-left",
  "bg-top-right",
  "bg-bottom-left",
  "bg-bottom-right",
  "object-bottom",
  "object-bottom-left",
  "object-bottom-right",
  "object-center",
  "object-left",
  "object-left-bottom",
  "object-left-top",
  "object-right",
  "object-right-bottom",
  "object-right-top",
  "object-top",
  "object-top-left",
  "object-top-right",
  "align-baseline",
  "align-sub",
  "align-super",
  "align-text-top",
  "align-text-bottom",
  "touch-pan-left",
  "touch-pan-right",
  "touch-pan-up",
  "touch-pan-down",
  "touch-pinch-zoom",
  "transition-discrete",
  "transition-normal",
  "mix-blend-plus-darker",
  "accent-auto",
  "collapse-none",
  "slashed-zero",
  "ordinal",
  "diagonal-fractions",
  "stacked-fractions",
  "forced-color-adjust-auto",
  "list-image-none",
  "box-decoration-clone",
  "box-decoration-slice",
  "bg-origin-border",
  "bg-origin-content",
  "bg-origin-padding",
  "transform-border",
  "transform-content",
  "transform-fill",
  "transform-stroke",
  "transform-view",
])

/** Prefix handlers, tried longest-prefix first. `""` value means the bare prefix. */
const PREFIX: Record<string, Handler> = {
  // Spacing
  ...Object.fromEntries(
    Object.entries(boxEdges).flatMap(([k, sides]) => [
      [`p${k}`, edge("padding", sides)],
      [`m${k}`, edge("margin", sides)],
    ])
  ),
  gap: (v, ctx) => {
    const s = spacing(v, ctx)
    return typeof s === "number" || typeof s === "string" ? { style: { gap: s } } : undefined
  },
  "gap-x": (v, ctx) => ({ style: { columnGap: spacing(v, ctx) } }),
  "gap-y": (v, ctx) => ({ style: { rowGap: spacing(v, ctx) } }),
  // `space-*` targets children; the nearest native equivalent is gap.
  "space-x": (v, ctx) => ({ style: { columnGap: spacing(v, ctx) } }),
  "space-y": (v, ctx) => ({ style: { rowGap: spacing(v, ctx) } }),
  // Inset
  ...Object.fromEntries(
    Object.entries(insetSides).map(([k, props]) => [
      k,
      ((full, ctx) => {
        const val = neg(spacing(full, ctx), ctx)
        return val === undefined ? undefined : { style: Object.fromEntries(props.map((p) => [p, val])) }
      }) as Handler,
    ])
  ),
  z: (v, ctx) => {
    if (v === "auto") return { style: { zIndex: undefined } }
    const n = /^\d+$/.test(v) ? Number(v) : Number(decodeArbitrary(v))
    return Number.isFinite(n) ? { style: { zIndex: neg(n, ctx) } } : undefined
  },
  // Sizing
  w: size(["width"], containerSizes),
  h: size(["height"]),
  size: size(["width", "height"]),
  "min-w": size(["minWidth"], containerSizes),
  "min-h": size(["minHeight"]),
  "max-w": size(["maxWidth"], (ctx) => ({ ...containerSizes(ctx), prose: "65ch" })),
  "max-h": size(["maxHeight"]),
  // Logical sizes; horizontal writing mode maps inline to width and block to height.
  "min-inline": size(["minWidth"], containerSizes),
  "max-inline": size(["maxWidth"], containerSizes),
  "min-block": size(["minHeight"]),
  "max-block": size(["maxHeight"]),
  inline: size(["width"], containerSizes),
  block: size(["height"]),
  basis: size(["flexBasis"], containerSizes),
  aspect: (full, ctx) => {
    const [v, mod] = splitModifier(full)
    if (v === "square") return { style: { aspectRatio: 1 } }
    if (v === "video") return { style: { aspectRatio: 16 / 9 } }
    if (v === "auto") return { style: { aspectRatio: undefined } }
    if (mod !== undefined && /^\d+$/.test(v)) return { style: { aspectRatio: Number(v) / Number(mod) } }
    const arb = decodeArbitrary(full)
    if (arb !== undefined) {
      const css = substituteVars(arb, ctx.env)
      if (css === undefined) return undefined
      const [a, b] = css.split("/").map((x) => parseFloat(x))
      if (!Number.isFinite(a)) return undefined
      return { style: { aspectRatio: b ? a / b : a } }
    }
    return undefined
  },
  // Flex
  flex: (v, ctx) => {
    // Tailwind's `flex: N 1 0%`, not React Native's `flex: N` (a zero basis): a percentage basis
    // against a parent of unknown size falls back to the content size, in CSS and in Yoga, so a
    // `flex-1` item in an auto-height column keeps its content height instead of collapsing.
    if (/^\d+$/.test(v)) return { style: { flexGrow: Number(v), flexShrink: 1, flexBasis: "0%" } }
    // `flex-1/2` is `flex: 50%`: grow and shrink from a percentage basis.
    if (/^\d+\/\d+$/.test(v)) return { style: { flexGrow: 1, flexShrink: 1, flexBasis: spacing(v, ctx) } }
    const arb = decodeArbitrary(v)
    if (arb !== undefined) {
      const [grow, shrink, basis] = arb.split(" ")
      return {
        style: {
          flexGrow: Number(grow),
          flexShrink: shrink !== undefined ? Number(shrink) : 1,
          flexBasis: basis !== undefined ? dimension(basis, ctx.env) : "0%",
        },
      }
    }
    return undefined
  },
  grow: (v) => (/^\d+$/.test(v) ? { style: { flexGrow: Number(v) } } : undefined),
  shrink: (v) => (/^\d+$/.test(v) ? { style: { flexShrink: Number(v) } } : undefined),
  order: () => ({ style: {} }),
  // Colors
  bg: (v, ctx) => {
    const arb = decodeArbitrary(v)
    if (arb !== undefined && /^(linear|radial)-gradient\(/.test(arb.trim())) return { fx: { gradient: { css: arb.trim() } } }
    return withColor(v, ctx, (c) => ({ style: { backgroundColor: c } }))
  },
  placeholder: (v, ctx) => withColor(v, ctx, (c) => ({ props: { placeholderTextColor: c } })),
  // Gradients. Conic gradients have no native equivalent.
  "bg-linear": linearGradient,
  "bg-gradient": linearGradient,
  "bg-radial": (v, ctx) => {
    if (v === "") return { fx: { gradient: { kind: "radial", args: "" } } }
    const arb = decodeArbitrary(splitModifier(v)[0])
    if (arb === undefined) return undefined
    if (splitTopLevel(arb, ",").length > 1) return { fx: { gradient: { css: `radial-gradient(${arb})` } } }
    return { fx: { gradient: { kind: "radial", args: substituteVars(arb, ctx.env) ?? arb } } }
  },
  from: gradientStop("From"),
  via: gradientStop("Via"),
  to: gradientStop("To"),
  text: (v, ctx) => {
    const [base, mod] = splitModifier(v)
    if (ctx.env.getVar(`text-${base}`) === undefined && isColor(v, ctx)) {
      return withColor(v, ctx, (c) => ({ style: { color: c } }))
    }
    return fontSize(base, ctx, mod)
  },
  fill: (v, ctx) => withColor(v, ctx, (c) => ({ props: { fill: c } })),
  stroke: (v, ctx) => {
    if (/^\d+$/.test(v)) return { props: { strokeWidth: Number(v) } }
    return withColor(v, ctx, (c) => ({ props: { stroke: c } }))
  },
  caret: (v, ctx) => withColor(v, ctx, (c) => ({ props: { cursorColor: c } })),
  accent: (v, ctx) => withColor(v, ctx, (c) => ({ props: { accentColor: c } })),
  decoration: (v, ctx) => {
    if (["solid", "double", "dotted", "dashed", "wavy"].includes(v)) return { style: { textDecorationStyle: v } }
    if (/^\d+$/.test(v) || v === "auto" || v === "from-font") return { style: {} }
    return withColor(v, ctx, (c) => ({ style: { textDecorationColor: c } }))
  },
  "underline-offset": () => ({ style: {} }),
  opacity: (v, ctx) => {
    if (/^\d+$/.test(v)) return { style: { opacity: Number(v) / 100 } }
    const arb = decodeArbitrary(v)
    if (arb === undefined) return undefined
    const val = evaluate(arb, ctx.env)
    if (val?.kind === "number") return { style: { opacity: val.value } }
    if (val?.kind === "percent") return { style: { opacity: val.value / 100 } }
    return undefined
  },
  // Typography
  font: (v, ctx) => {
    if (fontWeights[v]) return { style: { fontWeight: fontWeights[v] } }
    const family = theme(ctx.env, "font", v)
    if (family !== undefined) return { style: { fontFamily: substituteVars(family, ctx.env) ?? family } }
    const arb = decodeArbitrary(v)
    if (arb !== undefined) {
      if (/^\d+$/.test(arb)) return { style: { fontWeight: arb } }
      return { style: { fontFamily: arb } }
    }
    return undefined
  },
  leading: (v, ctx) => {
    const lh = leadingValue(v, ctx)
    return lh === undefined ? undefined : { fx: { leading: lh } }
  },
  tracking: (v, ctx) => {
    const t = theme(ctx.env, "tracking", v) ?? decodeArbitrary(v)
    if (t === undefined) return undefined
    const m = /^(-?[\d.]+)em$/.exec(t.trim())
    if (m) return { fx: { trackingEm: neg(parseFloat(m[1]), ctx) } }
    const px = toDimension(t, ctx.env)
    return typeof px === "number" ? { style: { letterSpacing: neg(px, ctx) } } : undefined
  },
  "line-clamp": (v) => (/^\d+$/.test(v) ? { props: { numberOfLines: Number(v), ellipsizeMode: "tail" } } : undefined),
  indent: () => ({ style: {} }),
  // Borders
  ...Object.fromEntries(Object.entries(borderSides).map(([k, sides]) => [k ? `border-${k}` : "border", border(sides)])),
  ...Object.fromEntries(Object.entries(radiusCorners).map(([k, corners]) => [k ? `rounded-${k}` : "rounded", radius(corners)])),
  outline: (v, ctx) => {
    if (/^\d+$/.test(v)) return { style: { outlineWidth: Number(v), outlineStyle: "solid" } }
    return withColor(v, ctx, (c) => ({ style: { outlineColor: c } }))
  },
  "outline-offset": (v, ctx) => {
    const n = /^\d+$/.test(v) ? Number(v) : dimension(decodeArbitrary(v) ?? "", ctx.env)
    return typeof n === "number" ? { style: { outlineOffset: neg(n, ctx) } } : undefined
  },
  ring: (v, ctx) => {
    if (v === "" ) return { fx: { ringWidth: 1 } }
    if (/^\d+$/.test(v)) return { fx: { ringWidth: Number(v) } }
    if (isColor(v, ctx)) return withColor(v, ctx, (c) => ({ fx: { ringColor: c } }))
    const arb = decodeArbitrary(v)
    const w = arb !== undefined ? dimension(arb, ctx.env) : undefined
    return typeof w === "number" ? { fx: { ringWidth: w } } : undefined
  },
  "inset-ring": (v, ctx) => {
    if (v === "") return { fx: { insetRingWidth: 1 } }
    if (/^\d+$/.test(v)) return { fx: { insetRingWidth: Number(v) } }
    return withColor(v, ctx, (c) => ({ fx: { insetRingColor: c } }))
  },
  "ring-offset": (v, ctx) => {
    if (/^\d+$/.test(v)) return { fx: { ringOffsetWidth: Number(v) } }
    return withColor(v, ctx, (c) => ({ fx: { ringOffsetColor: c } }))
  },
  "divide-x": divideWidth("X"),
  "divide-y": divideWidth("Y"),
  divide: (v, ctx) => {
    if (["solid", "dashed", "dotted"].includes(v)) return { fx: { divideStyle: v } }
    if (v === "double") return { fx: { divideStyle: "solid" } }
    if (v === "none") return { fx: { divideX: 0, divideY: 0 } }
    return withColor(v, ctx, (c) => ({ fx: { divideColor: c } }))
  },
  // Effects
  shadow: (v, ctx) => {
    const s = shadowValue(v, ctx, "shadow")
    if (s !== undefined) return { fx: { shadow: s } }
    return withColor(v, ctx, (c) => ({ fx: { shadowColor: c } }))
  },
  "inset-shadow": (v, ctx) => {
    const s = shadowValue(v, ctx, "inset-shadow")
    if (s !== undefined) return { fx: { insetShadow: s } }
    return withColor(v, ctx, (c) => ({ fx: { insetShadowColor: c } }))
  },
  "drop-shadow": shadowFamily("drop-shadow"),
  "text-shadow": shadowFamily("text-shadow"),
  blur: filterHandler("blur"),
  brightness: filterHandler("brightness"),
  contrast: filterHandler("contrast"),
  grayscale: filterHandler("grayscale"),
  "hue-rotate": filterHandler("hueRotate"),
  invert: filterHandler("invert"),
  saturate: filterHandler("saturate"),
  sepia: filterHandler("sepia"),
  filter: noop,
  // Backdrop filters need a native blur view (e.g. expo-blur); there is no style equivalent.
  backdrop: noop,
  // Transforms
  "translate-x": transformHandler("translateX"),
  "translate-y": transformHandler("translateY"),
  translate: transformHandler("both"),
  rotate: (v, ctx) => {
    const a = angle(v, ctx)
    return a === undefined ? undefined : { fx: { rotate: a } }
  },
  scale: (v, ctx) => {
    const s = scaleValue(v, ctx)
    return s === undefined ? undefined : { fx: { scaleX: s, scaleY: s } }
  },
  "scale-x": (v, ctx) => {
    const s = scaleValue(v, ctx)
    return s === undefined ? undefined : { fx: { scaleX: s } }
  },
  "scale-y": (v, ctx) => {
    const s = scaleValue(v, ctx)
    return s === undefined ? undefined : { fx: { scaleY: s } }
  },
  "rotate-x": (v, ctx) => {
    const a = angle(v, ctx)
    return a === undefined ? undefined : { fx: { rotateX: a } }
  },
  "rotate-y": (v, ctx) => {
    const a = angle(v, ctx)
    return a === undefined ? undefined : { fx: { rotateY: a } }
  },
  "rotate-z": (v, ctx) => {
    const a = angle(v, ctx)
    return a === undefined ? undefined : { fx: { rotateZ: a } }
  },
  skew: (v, ctx) => {
    const a = angle(v, ctx)
    return a === undefined ? undefined : { fx: { skewX: a, skewY: a } }
  },
  // React Native transforms have no z translation or scale.
  "translate-z": noop,
  "scale-z": noop,
  perspective: (v, ctx) => {
    if (v === "none") return { fx: { perspective: "none" } }
    const t = theme(ctx.env, "perspective", v) ?? decodeArbitrary(v)
    const px = t !== undefined ? toDimension(t, ctx.env) : undefined
    return typeof px === "number" ? { fx: { perspective: px } } : undefined
  },
  "perspective-origin": noop,
  "skew-x": (v, ctx) => {
    const a = angle(v, ctx)
    return a === undefined ? undefined : { fx: { skewX: a } }
  },
  "skew-y": (v, ctx) => {
    const a = angle(v, ctx)
    return a === undefined ? undefined : { fx: { skewY: a } }
  },
  origin: (v) => {
    const map: Record<string, string> = {
      center: "center",
      top: "top",
      "top-right": "top right",
      right: "right",
      "bottom-right": "bottom right",
      bottom: "bottom",
      "bottom-left": "bottom left",
      left: "left",
      "top-left": "top left",
    }
    const o = map[v] ?? decodeArbitrary(v)
    return o === undefined ? undefined : { style: { transformOrigin: o } }
  },
  // Motion. Recorded so components can opt in to native animation.
  animate: (v) => (v === "none" ? { animation: undefined } : { animation: v }),
  transition: (v) => {
    if (v in TRANSITIONS) return { fx: { transition: TRANSITIONS[v] } }
    const arb = decodeArbitrary(v)
    return arb === undefined ? undefined : { fx: { transition: transitionProperties(arb) } }
  },
  duration: (v, ctx) => {
    if (v === "initial") return { fx: { transitionDuration: undefined } }
    const ms = timeMs(v, ctx)
    return ms === undefined ? undefined : { fx: { transitionDuration: ms } }
  },
  delay: (v, ctx) => {
    const ms = timeMs(v, ctx)
    return ms === undefined ? undefined : { fx: { transitionDelay: ms } }
  },
  ease: (v, ctx) => {
    if (v === "initial") return { fx: { transitionEasing: undefined } }
    const css = v === "linear" ? "linear" : theme(ctx.env, "ease", v) ?? decodeArbitrary(v)
    const e = css !== undefined ? bezier(css) : undefined
    return e === undefined ? undefined : { fx: { transitionEasing: e } }
  },
  // Web-only families
  cursor: () => ({ style: {} }),
  "will-change": () => ({ style: {} }),
  // Scroll margin/padding/snap and scrollbars are browser scrolling features.
  scroll: noop,
  snap: noop,
  scrollbar: noop,
  // Equal-width templates are emulated; others (`[1fr_auto]`) keep the flex column layout.
  "grid-cols": (v) => ({ fx: { gridCols: gridColumns(v) ?? null } }),
  "col-span": (v) => {
    if (v === "full") return { fx: { colSpan: "full" } }
    const n = /^\d+$/.test(v) ? Number(v) : Number(decodeArbitrary(v))
    return Number.isFinite(n) ? { fx: { colSpan: n } } : undefined
  },
  // Rows, explicit placement and item alignment aren't emulated: cells flow in order.
  "grid-rows": noop,
  "grid-flow": noop,
  "auto-rows": noop,
  "auto-cols": noop,
  col: noop,
  row: noop,
  "justify-items": noop,
  "justify-self": noop,
  "place-items": noop,
  "place-content": noop,
  "place-self": noop,
  // Tables, backgrounds and type features React Native doesn't have.
  "border-spacing": noop,
  "bg-blend": noop,
  "font-stretch": noop,
  break: noop,
  // Floats, containment, color-scheme, zoom and tab sizes are browser layout features.
  float: noop,
  clear: noop,
  contain: noop,
  scheme: noop,
  zoom: noop,
  tab: noop,
  overscroll: noop,
  columns: () => ({ style: {} }),
  "bg-conic": noop,
  "bg-position": () => ({ style: {} }),
  "bg-size": () => ({ style: {} }),
  content: () => ({ style: {} }),
  mask: () => ({ style: {} }),
  "shimmer-color": () => ({ style: {} }),
  "shimmer-duration": () => ({ style: {} }),
}

const PREFIXES = Object.keys(PREFIX).sort((a, b) => b.length - a.length)

/** Arbitrary properties: `[--my-var:1rem]` and `[prop:value]`. */
function arbitraryProperty(utility: string, ctx: UtilityContext): Decl | undefined {
  const m = /^\[([a-z-]+|--[\w-]+):(.+)\]$/.exec(utility)
  if (!m) return undefined
  const [, prop, rawValue] = m
  const value = rawValue.replace(/(?<!\\)_/g, " ").replace(/\\_/g, "_")
  if (prop.startsWith("--")) return { vars: { [prop.slice(2)]: value } }
  const key = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
  const v = evaluate(value, ctx.env)
  if (!v) return undefined
  const out =
    v.kind === "length" ? v.px : v.kind === "percent" ? `${v.value}%` : v.kind === "number" ? v.value : v.value
  return { style: { [key]: out } }
}

/**
 * Resolves one utility (no variants). Returns `undefined` when the utility is
 * unknown, and an empty decl for known web-only utilities.
 */
export function resolveUtility(utility: string, ctx: UtilityContext): Decl | undefined {
  if (STATIC[utility]) return STATIC[utility]
  if (NOOP.has(utility)) return {}
  if (utility.startsWith("[")) return arbitraryProperty(utility, ctx)
  for (const prefix of PREFIXES) {
    if (utility === prefix) return PREFIX[prefix]("", ctx)
    if (utility.startsWith(prefix + "-")) {
      // Handlers get the full value (`primary/50`, `1/2`) and split modifiers themselves.
      const decl = PREFIX[prefix](utility.slice(prefix.length + 1), ctx)
      if (decl !== undefined) return decl
    }
  }
  return undefined
}
