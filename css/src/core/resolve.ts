/**
 * className → React Native style + props.
 *
 * Mirrors how Tailwind orders CSS: `cn-*` theme tokens expand into the
 * components layer (lowest priority), utilities follow, variant-qualified
 * utilities win over plain ones, and `!important` wins over everything.
 */
import { decodeArbitrary, parseClass, splitClassName, type ParsedClass } from "./parse"
import {
  collapseShadow,
  CURRENT_COLOR,
  FILTERS,
  nativeColorsIn,
  normalizeShadow,
  parseShadowLayers,
  resolveUtility,
  type Decl,
  type Effects,
  type TransitionGroup,
} from "./utilities"
import { interactionNeeds, matchVariant, type Pseudo, type VariantEnv } from "./variants"
import { substituteVars, toDimension, type ValueEnv } from "./value"

export type FontResolver = (
  family: string | undefined,
  weight: string | undefined,
  style: string | undefined
) => { fontFamily?: string; fontWeight?: string; fontStyle?: string }

export interface ResolveEnv extends Omit<VariantEnv, "self"> {
  self: VariantEnv["self"]
  /** Base variables: Tailwind defaults, theme mapping, color-mode tokens. */
  getVar(name: string): string | undefined
  /** Variables cascaded from ancestors (`[--x:...]` classes). */
  inheritedVars?: Record<string, string>
  /** Expands `cn-*` style tokens. */
  styleMap?: Record<string, string>
  /** Inherited font size in px, used for `em` and relative line heights. */
  em: number
  /** Inherited line height in px, used for `lh`. */
  lineHeight?: number
  rem: number
  windowHeight: number
  /** Inherited text color, used for currentColor rings and borders. */
  currentColor?: string
  /**
   * Whether the parent's classes make it a flex or grid container. CSS stretches an
   * `inline-flex` child of a flex container like any flex item; only in block layout does it
   * shrink to its content, which is what `inline-flex` emulates otherwise.
   */
  parentFlex?: boolean
  fonts?: FontResolver
  /** Default border color when a border width is set without a color. */
  defaultBorderColor?: string
  /** Default outline color when an outline width is set without a color. */
  defaultOutlineColor?: string
  /** Called once per unsupported class in development. */
  onUnsupported?: (className: string, reason: string) => void
}

/**
 * React Native's filter list as a CSS `filter` string: react-native-web only supports the
 * string form. Lengths are px and hue-rotate is degrees, as React Native reads plain numbers.
 */
function cssFilter(filter: Record<string, unknown>[]): string {
  const unit = (v: unknown, u: string) => (typeof v === "number" ? `${v}${u}` : String(v))
  return filter
    .map((f) => {
      const [name, v] = Object.entries(f)[0]
      if (name === "dropShadow") {
        const d = v as { offsetX: number; offsetY: number; standardDeviation: number; color: string }
        return `drop-shadow(${d.offsetX}px ${d.offsetY}px ${d.standardDeviation * 2}px ${d.color})`
      }
      if (name === "blur") return `blur(${unit(v, "px")})`
      if (name === "hueRotate") return `hue-rotate(${unit(v, "deg")})`
      return `${name}(${v})`
    })
    .join(" ")
}

/** Display utilities that make an element a flex (or emulated grid) container, and block-like ones. */
const FLEX_DISPLAY = new Set(["flex", "inline-flex", "grid", "inline-grid"])
const BLOCK_DISPLAY = new Set(["block", "inline-block", "inline", "flow-root", "list-item", "table", "contents"])
const FLEX_LAYOUT_KEYS = ["flexDirection", "flexWrap", "alignItems", "justifyContent"]

export interface Resolved {
  style: Record<string, unknown>
  /** Whether the classes make the element a flex or grid container (for its children's `parentFlex`). */
  flexContainer?: boolean
  props: Record<string, unknown>
  /** Custom properties this element defines, for its descendants. */
  vars?: Record<string, string>
  animation?: string
  /** Name of the group this element declares (`""` for plain `group`). */
  group?: string
  /** Interaction states the element's own classes depend on. */
  needs: { press: boolean; hover: boolean; focus: boolean }
  /** Whether any class depends on group-* state. */
  usesGroups: boolean
  /** Defaults for descendant icons, from `[&_svg]:` classes. */
  icon?: { size?: number; color?: string; strokeWidth?: number }
  /** Container name when the element is a query container (`@container`, `@container/name`). */
  container?: string
  /** Peer name when the element is a peer (`peer`, `peer/name`). */
  peer?: string
  /** Classes for direct children, from `*:` variants. */
  childClass?: string
  /** Classes for every descendant, from `**:` variants. */
  descendantClass?: string
  /** Borders drawn between children (`divide-*`), applied to all but the last child. */
  divide?: { x?: number; y?: number; xReverse?: boolean; yReverse?: boolean; color?: string; style?: string }
  /** Emulated grid: children are laid out `cols` per row. */
  grid?: { cols: number; gap: number }
  /** Columns this element spans in an emulated grid (`col-span-*`). */
  colSpan?: number | "full"
  /** Style changes to animate (`transition-*`). */
  transition?: { groups: TransitionGroup[]; duration: number; easing: [number, number, number, number] | "linear"; delay: number }
}

interface Entry {
  parsed: ParsedClass
  tier: number
  index: number
}

const GENERIC_FONTS = new Set([
  "sans-serif",
  "serif",
  "system-ui",
  "ui-sans-serif",
  "ui-serif",
  "-apple-system",
  "blinkmacsystemfont",
  "'segoe ui'",
  "roboto",
])

function firstFamily(css: string | undefined): string | undefined {
  if (!css) return undefined
  const first = css.split(",")[0].trim()
  if (GENERIC_FONTS.has(first.toLowerCase())) return undefined
  return first.replace(/^['"]|['"]$/g, "")
}

/** Expands className into ordered entries, following `cn-*` tokens. */
function expand(className: string, styleMap: Record<string, string> | undefined) {
  const entries: Entry[] = []
  let group: string | undefined
  let container: string | undefined
  let peer: string | undefined
  let index = 0
  const visit = (cls: string, tier: number, depth: number) => {
    if (cls.startsWith("cn-")) {
      const expanded = styleMap?.[cls]
      if (expanded && depth < 4) for (const c of splitClassName(expanded)) visit(c, 0, depth + 1)
      return
    }
    if (cls === "group" || cls.startsWith("group/")) {
      group = cls === "group" ? "" : cls.slice(6)
      return
    }
    if (cls === "peer" || cls.startsWith("peer/")) {
      peer = cls === "peer" ? "" : cls.slice(5)
      return
    }
    if (cls === "@container" || cls.startsWith("@container/")) {
      container = cls === "@container" ? "" : cls.slice(11)
      return
    }
    if (cls.startsWith("@container-")) return
    const parsed = parseClass(cls)
    if (parsed) entries.push({ parsed, tier, index: index++ })
  }
  for (const cls of splitClassName(className)) visit(cls, 1, 0)
  return { entries, group, container, peer }
}

/** `*` and `**` (and their arbitrary forms) target children and descendants. */
const CHILD_VARIANTS: Record<string, "child" | "descendant"> = {
  "*": "child",
  "[&>*]": "child",
  "**": "descendant",
  "[&_*]": "descendant",
}

const rank = (e: Entry) => [e.parsed.important ? 1 : 0, e.tier, e.parsed.variants.length, e.index]
function compareEntries(a: Entry, b: Entry) {
  const ra = rank(a)
  const rb = rank(b)
  for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i]
  return 0
}

export function resolve(className: string, env: ResolveEnv): Resolved {
  const { entries, group, container, peer } = expand(className, env.styleMap)
  entries.sort(compareEntries)

  const needs = { press: false, hover: false, focus: false }
  let usesGroups = false

  // Variant matching, once per entry.
  const matched: { entry: Entry; pseudo?: Pseudo }[] = []
  const childClasses: string[] = []
  const descendantClasses: string[] = []
  for (const entry of entries) {
    const { variants } = entry.parsed
    // `*:`/`**:` hand the rest of the class to children; variants before them apply here.
    const at = variants.findIndex((v) => v in CHILD_VARIANTS)
    if (at >= 0) {
      if (variants.slice(0, at).every((v) => matchVariant(v, env) === true)) {
        const prefix = variants.slice(0, at + 1).join(":") + ":"
        const rest = entry.parsed.raw.slice(prefix.length)
        ;(CHILD_VARIANTS[variants[at]] === "child" ? childClasses : descendantClasses).push(rest)
      }
      continue
    }
    const n = interactionNeeds(variants)
    needs.press ||= n.press
    needs.hover ||= n.hover
    needs.focus ||= n.focus
    let ok = true
    let pseudo: Pseudo | undefined
    for (const v of variants) {
      if (v.startsWith("group-")) usesGroups = true
      const r = matchVariant(v, env)
      if (r === "unsupported") {
        env.onUnsupported?.(entry.parsed.raw, `variant "${v}" has no native equivalent`)
        ok = false
        break
      }
      if (r === false) {
        ok = false
        break
      }
      if (typeof r === "object") pseudo = r.pseudo
    }
    if (ok) matched.push({ entry, pseudo })
  }

  // Custom properties first: they apply to the element's own utilities.
  let localVars: Record<string, string> | undefined
  for (const { entry } of matched) {
    const u = entry.parsed.utility
    const m = /^\[--([\w-]+):(.+)\]$/.exec(u)
    if (m) (localVars ??= {})[m[1]] = m[2].replace(/(?<!\\)_/g, " ")
  }
  const inherited = env.inheritedVars
  if (localVars) localVars = computeVars(localVars, inherited, env)
  const valueEnv: ValueEnv = {
    getVar: (name) => localVars?.[name] ?? inherited?.[name] ?? env.getVar(name),
    rem: env.rem,
    em: env.em,
    vw: env.windowWidth,
    vh: env.windowHeight,
    lh: env.lineHeight,
  }

  const defaults: Record<string, unknown> = {}
  const style: Record<string, unknown> = {}
  const props: Record<string, unknown> = {}
  const fx: Effects = {}
  let animation: string | undefined
  let icon: Resolved["icon"]
  let flexContainer: boolean | undefined

  for (const { entry, pseudo } of matched) {
    const { parsed } = entry
    if (/^\[--[\w-]+:/.test(parsed.utility)) continue
    const decl: Decl | undefined = resolveUtility(parsed.utility, { env: valueEnv, negative: parsed.negative })
    if (decl === undefined) {
      env.onUnsupported?.(parsed.raw, "unknown utility")
      continue
    }
    if (pseudo === "placeholder") {
      if (decl.style?.color !== undefined) props.placeholderTextColor = decl.style.color
      continue
    }
    if (pseudo === "svg") {
      const st = decl.style ?? {}
      const size = (st.width ?? st.height) as unknown
      if (typeof size === "number") (icon ??= {}).size = size
      if (typeof st.color === "string") (icon ??= {}).color = st.color
      if (typeof decl.props?.strokeWidth === "number") (icon ??= {}).strokeWidth = decl.props.strokeWidth
      continue
    }
    if (pseudo === "selection") {
      const c = decl.style?.backgroundColor ?? decl.style?.color
      if (c !== undefined) props.selectionColor = c
      continue
    }
    if (decl.defaults) {
      Object.assign(defaults, decl.defaults)
      if (env.parentFlex && "alignSelf" in decl.defaults) delete defaults.alignSelf
    }
    if (FLEX_DISPLAY.has(parsed.utility)) flexContainer = true
    else if (BLOCK_DISPLAY.has(parsed.utility)) flexContainer = false
    if (decl.style) assignStyle(style, decl.style)
    if (decl.props) Object.assign(props, decl.props)
    if (decl.fx) {
      const { filters, ...rest } = decl.fx
      Object.assign(fx, rest)
      // Filter classes combine (`blur-sm grayscale`); `filter-none` clears them.
      if ("filters" in decl.fx) fx.filters = filters ? { ...fx.filters, ...filters } : undefined
    }
    if ("animation" in decl) animation = decl.animation
  }

  const out: Record<string, unknown> = { ...defaults, ...style }
  // `*-current` classes use the element's own text color, else the inherited one.
  // (`text-current` itself is the inherited color.)
  const own = style.color === CURRENT_COLOR ? undefined : (style.color as string | undefined)
  const current = own ?? env.currentColor ?? "rgba(0, 0, 0, 1)"
  const swap = (o: Record<string, unknown>) => {
    for (const k in o) if (o[k] === CURRENT_COLOR) o[k] = current
  }
  swap(out)
  swap(props)
  for (const k of Object.keys(fx) as (keyof Effects)[]) if (fx[k] === CURRENT_COLOR) (fx as Record<string, unknown>)[k] = current
  finalize(out, fx, env)
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k]

  // `perspective-*` applies to descendants' 3D transforms, like CSS.
  if (fx.perspective !== undefined) (localVars ??= {})["tw-perspective"] = String(fx.perspective)

  // Every React Native view is a flex container, and native code often sets `flex-row` or
  // `items-center` without `flex`: flex layout classes count as one unless a display class says otherwise.
  if (flexContainer === undefined && FLEX_LAYOUT_KEYS.some((k) => style[k] !== undefined)) flexContainer = true
  const result: Resolved = { style: out, props, vars: localVars, animation, group, needs, usesGroups, icon, flexContainer }
  if (container !== undefined) result.container = container
  if (peer !== undefined) result.peer = peer
  if (childClasses.length) result.childClass = childClasses.join(" ")
  if (descendantClasses.length) result.descendantClass = descendantClasses.join(" ")
  if (fx.divideX || fx.divideY) {
    result.divide = {
      x: fx.divideX || undefined,
      y: fx.divideY || undefined,
      xReverse: fx.divideXReverse,
      yReverse: fx.divideYReverse,
      color: fx.divideColor ?? env.defaultBorderColor ?? env.currentColor,
      style: fx.divideStyle,
    }
  }
  if (fx.grid && fx.gridCols) {
    out.flexDirection = "row"
    out.flexWrap = "wrap"
    const gap = (out.columnGap ?? out.gap ?? 0) as number
    result.grid = { cols: fx.gridCols, gap: typeof gap === "number" ? gap : 0 }
  }
  if (fx.colSpan !== undefined) result.colSpan = fx.colSpan
  if (fx.transition && fx.transition !== "none" && fx.transition.length) {
    const duration = fx.transitionDuration ?? parseMs(env.getVar("default-transition-duration")) ?? 150
    const easing =
      fx.transitionEasing ?? parseBezier(env.getVar("default-transition-timing-function")) ?? [0.4, 0, 0.2, 1]
    result.transition = { groups: fx.transition, duration, easing, delay: fx.transitionDelay ?? 0 }
  }
  return result
}

function parseMs(css: string | undefined): number | undefined {
  const m = css && /^([\d.]+)(ms|s)$/.exec(css.trim())
  return m ? parseFloat(m[1]) * (m[2] === "s" ? 1000 : 1) : undefined
}

function parseBezier(css: string | undefined): [number, number, number, number] | undefined {
  const m = css && /^cubic-bezier\(([^)]+)\)$/.exec(css.trim())
  const n = m ? m[1].split(",").map((x) => parseFloat(x)) : []
  return n.length === 4 ? (n as [number, number, number, number]) : undefined
}

/**
 * Computes custom properties the way CSS does: `var()` references are
 * substituted where the property is declared, a self-reference
 * (`[--radius:var(--radius-xl)]` → `--radius-xl: calc(var(--radius) * 1.4)`)
 * sees the parent's value, and theme variables are computed at the root.
 * Descendants inherit the substituted values.
 */
function computeVars(
  raw: Record<string, string>,
  inherited: Record<string, string> | undefined,
  env: ResolveEnv
): Record<string, string> {
  const envFor = (getVar: (n: string) => string | undefined): ValueEnv => ({
    getVar,
    rem: env.rem,
    em: env.em,
    vw: env.windowWidth,
    vh: env.windowHeight,
  })
  const rootEnv = envFor(env.getVar)
  const parent = (name: string) => {
    if (inherited?.[name] !== undefined) return inherited[name]
    const base = env.getVar(name)
    return base === undefined ? undefined : (substituteVars(base, rootEnv) ?? base)
  }
  const out: Record<string, string> = {}
  for (const [name, value] of Object.entries(raw)) {
    const scope = envFor((n) => (n !== name && raw[n] !== undefined ? raw[n] : parent(n)))
    out[name] = substituteVars(value, scope) ?? value
  }
  return out
}

/**
 * React Native lets longhands (paddingLeft) beat shorthands (padding) regardless
 * of order; CSS lets the later declaration win. Clear covered longhands so a
 * later `p-0` overrides an earlier `px-4`, as it does on the web.
 */
const SIDES = ["Top", "Right", "Bottom", "Left", "Start", "End"]
const COVERS: Record<string, string[]> = {}
for (const p of ["padding", "margin"]) {
  COVERS[p] = ["Horizontal", "Vertical", ...SIDES].map((s) => p + s)
  COVERS[`${p}Horizontal`] = ["Left", "Right", "Start", "End"].map((s) => p + s)
  COVERS[`${p}Vertical`] = ["Top", "Bottom"].map((s) => p + s)
}
for (const kind of ["Width", "Color"]) {
  COVERS[`border${kind}`] = SIDES.map((s) => `border${s}${kind}`)
}
COVERS.borderRadius = [
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "borderTopStartRadius",
  "borderTopEndRadius",
  "borderBottomStartRadius",
  "borderBottomEndRadius",
]
COVERS.gap = ["rowGap", "columnGap"]
COVERS.flex = ["flexGrow", "flexShrink", "flexBasis"]

function assignStyle(target: Record<string, unknown>, source: Record<string, unknown>) {
  for (const key in source) {
    const covered = COVERS[key]
    if (covered) for (const c of covered) delete target[c]
    target[key] = source[key]
  }
}

function finalize(style: Record<string, unknown>, fx: Effects, env: ResolveEnv) {
  const fontSize = typeof style.fontSize === "number" ? style.fontSize : env.em

  // Line height: leading-* beats the text size's default.
  const leading = fx.leading ?? fx.textLeading
  if (leading !== undefined) {
    style.lineHeight = typeof leading === "number" ? Math.round(leading * fontSize * 100) / 100 : leading.px
  }
  if (fx.trackingEm !== undefined) style.letterSpacing = fx.trackingEm * fontSize

  // Fonts
  if (style.fontFamily !== undefined || style.fontWeight !== undefined || style.fontStyle !== undefined) {
    const family = typeof style.fontFamily === "string" ? firstFamily(style.fontFamily) : undefined
    if (env.fonts) {
      Object.assign(
        style,
        env.fonts(family, style.fontWeight as string | undefined, style.fontStyle as string | undefined)
      )
    } else {
      style.fontFamily = family
    }
  }

  // CSS ignores aspect-ratio when both width and height are set; Yoga would instead derive
  // one from the other (e.g. `aspect-video h-[200px] w-full` would come out 355px wide).
  const sized = (v: unknown) => v !== undefined && v !== "auto"
  if (style.aspectRatio !== undefined && sized(style.width) && sized(style.height)) delete style.aspectRatio

  // Borders default to the theme's border color when it defines one.
  const hasBorder = Object.keys(style).some((k) => /^border(Top|Right|Bottom|Left|Start|End)?Width$/.test(k))
  if (hasBorder && style.borderColor === undefined && env.defaultBorderColor) {
    style.borderColor = env.defaultBorderColor
  }
  if (style.outlineWidth !== undefined && style.outlineColor === undefined && env.defaultOutlineColor) {
    style.outlineColor = env.defaultOutlineColor
  }

  // Transforms in CSS's order: the translate, rotate and scale properties, then `transform`
  // (Tailwind's rotate-x/y/z and skew). 3D rotations use the nearest ancestor's perspective.
  const transform: Record<string, unknown>[] = []
  const has3d = fx.rotateX !== undefined || fx.rotateY !== undefined
  const perspective = Number(env.inheritedVars?.["tw-perspective"])
  if (has3d && Number.isFinite(perspective) && perspective > 0) transform.push({ perspective })
  if (fx.translateX !== undefined && fx.translateX !== 0) transform.push({ translateX: fx.translateX })
  if (fx.translateY !== undefined && fx.translateY !== 0) transform.push({ translateY: fx.translateY })
  if (fx.rotate !== undefined && fx.rotate !== "0deg") transform.push({ rotate: fx.rotate })
  if (fx.scaleX !== undefined && fx.scaleX !== 1) transform.push({ scaleX: fx.scaleX })
  if (fx.scaleY !== undefined && fx.scaleY !== 1) transform.push({ scaleY: fx.scaleY })
  if (fx.rotateX !== undefined) transform.push({ rotateX: fx.rotateX })
  if (fx.rotateY !== undefined) transform.push({ rotateY: fx.rotateY })
  if (fx.rotateZ !== undefined) transform.push({ rotateZ: fx.rotateZ })
  if (fx.skewX !== undefined) transform.push({ skewX: fx.skewX })
  if (fx.skewY !== undefined) transform.push({ skewY: fx.skewY })
  if (transform.length) style.transform = transform

  // Box shadow: inset shadow, inset ring, ring offset, ring, shadow (Tailwind's order).
  const currentColor = (style.color as string | undefined) ?? env.currentColor ?? "rgba(0, 0, 0, 1)"
  const valueEnv = { getVar: env.getVar, rem: env.rem, em: fontSize, vw: env.windowWidth, vh: env.windowHeight }
  const layers: string[] = []
  if (fx.insetShadow && fx.insetShadow !== "none") {
    layers.push(fx.insetShadowColor ? normalizeShadow(fx.insetShadow, valueEnv, fx.insetShadowColor) : fx.insetShadow)
  }
  if (fx.insetRingWidth) {
    layers.push(`inset 0 0 0 ${fx.insetRingWidth}px ${fx.insetRingColor ?? currentColor}`)
  }
  if (fx.ringWidth) {
    const offset = fx.ringOffsetWidth ?? 0
    const ringColor = fx.ringColor ?? currentColor
    if (fx.ringInset) {
      layers.push(`inset 0 0 0 ${fx.ringWidth + offset}px ${ringColor}`)
    } else {
      if (offset) layers.push(`0 0 0 ${offset}px ${fx.ringOffsetColor ?? "rgba(255, 255, 255, 1)"}`)
      layers.push(`0 0 0 ${fx.ringWidth + offset}px ${ringColor}`)
    }
  }
  if (fx.shadow && fx.shadow !== "none") {
    layers.push(fx.shadowColor ? normalizeShadow(fx.shadow, valueEnv, fx.shadowColor) : fx.shadow)
  }
  if (layers.length) style.boxShadow = layers.join(", ")

  // Text shadow (CSS allows a list; React Native one shadow). Inherited like other text styles.
  if (fx.textShadow === null) {
    style.textShadowColor = "rgba(0, 0, 0, 0)"
    style.textShadowRadius = 0
    style.textShadowOffset = { width: 0, height: 0 }
  } else if (fx.textShadow) {
    const color = fx.textShadowColor ?? fx.textShadow.color ?? "rgba(0, 0, 0, 0.1)"
    style.textShadowColor = fx.textShadowOpacity !== undefined ? (withAlpha(color, fx.textShadowOpacity) ?? color) : color
    style.textShadowOffset = { width: fx.textShadow.x, height: fx.textShadow.y }
    style.textShadowRadius = fx.textShadow.blur
  }

  // Filters, then drop shadow (Tailwind's order).
  const filter: Record<string, unknown>[] = []
  for (const name of FILTERS) {
    const v = fx.filters?.[name]
    if (v !== undefined) filter.push({ [name]: v })
  }
  if (fx.dropShadow) {
    const layers = parseShadowLayers(fx.dropShadow, valueEnvFor(env, fontSize))
    const tint = (c: string | undefined) => {
      const base = fx.dropShadowColor ?? c ?? "rgba(0, 0, 0, 0.1)"
      return fx.dropShadowOpacity !== undefined ? (withAlpha(base, fx.dropShadowOpacity) ?? base) : base
    }
    if (env.platform === "ios") {
      // iOS has no drop-shadow filter, but layer shadows follow the view's opaque content.
      const l = collapseShadow(layers)
      const m = l && /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(tint(l.color))
      if (l && m) {
        style.shadowColor = `rgba(${m[1]}, ${m[2]}, ${m[3]}, 1)`
        style.shadowOpacity = Number(m[4])
        style.shadowOffset = { width: l.x, height: l.y }
        style.shadowRadius = l.blur / 2
      }
    } else {
      for (const l of layers) {
        filter.push({ dropShadow: { offsetX: l.x, offsetY: l.y, standardDeviation: l.blur / 2, color: tint(l.color) } })
      }
    }
  }
  if (filter.length) style.filter = env.platform === "web" ? cssFilter(filter) : filter

  // `outline-none`/`outline-hidden`: browsers draw focus rings with `outline-style: auto`, which
  // ignores a zero width, so hide the style too on web.
  if (env.platform === "web" && style.outlineWidth === 0 && style.outlineStyle === undefined) style.outlineStyle = "none"

  // Gradients (React Native 0.76+, new architecture).
  if (fx.gradient) {
    const venv = valueEnvFor(env, fontSize)
    let css: string
    if ("css" in fx.gradient) {
      css = nativeColorsIn(fx.gradient.css, venv)
    } else {
      const clear = "rgba(0, 0, 0, 0)"
      const stop = (c: string, pos: string | undefined) => (pos ? `${c} ${pos}` : c)
      const stops = [stop(fx.gradientFrom ?? clear, fx.gradientFromPos ?? "0%")]
      if (fx.gradientVia) stops.push(stop(fx.gradientVia, fx.gradientViaPos ?? "50%"))
      stops.push(stop(fx.gradientTo ?? clear, fx.gradientToPos ?? "100%"))
      const args = fx.gradient.args ? `${fx.gradient.args}, ` : ""
      css = `${fx.gradient.kind}-gradient(${args}${stops.join(", ")})`
    }
    style[env.platform === "web" ? "backgroundImage" : "experimental_backgroundImage"] = css
  }
}

const valueEnvFor = (env: ResolveEnv, em: number): ValueEnv => ({
  getVar: env.getVar,
  rem: env.rem,
  em,
  vw: env.windowWidth,
  vh: env.windowHeight,
})

function withAlpha(color: string, opacity: number): string | undefined {
  const m = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(color)
  if (!m) return undefined
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${Math.round(Number(m[4]) * opacity * 1000) / 1000})`
}

/** Evaluates a length expression in the given env, e.g. for `size-*` on icons. */
export function resolveLength(css: string, env: ResolveEnv): number | undefined {
  const v = toDimension(decodeArbitrary(css) ?? css, {
    getVar: env.getVar,
    rem: env.rem,
    em: env.em,
    vw: env.windowWidth,
    vh: env.windowHeight,
  })
  return typeof v === "number" ? v : undefined
}
