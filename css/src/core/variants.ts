/**
 * Variant matching. Each variant is checked against the element's state:
 * interaction (pressed/hovered/focused), its data-* and aria-* props, its
 * position among its siblings, its JSX descendants (`has-*`), color scheme,
 * platform, window and container size, and the state of named groups and peers.
 */

export type Attrs = Record<string, string | number | boolean | null | undefined>

export interface InteractionState {
  pressed?: boolean
  hovered?: boolean
  focused?: boolean
  focusVisible?: boolean
  disabled?: boolean
}

export interface ElementState extends InteractionState {
  /** data-* and aria-* props, keyed with their prefix (`data-state`, `aria-invalid`). */
  attrs: Attrs
  /** Position among the parent's children, when the parent is an AstraWind element. */
  index?: number
  count?: number
  /** Whether the element has no children (`empty:`). */
  empty?: boolean
  /** Attrs of the element's JSX descendants, for `has-*`. Icons carry `svg: true`. */
  has?: Attrs[]
}

export interface VariantEnv {
  colorScheme: "light" | "dark"
  platform: string
  rtl: boolean
  windowWidth: number
  /** Breakpoint name → min width in px. */
  breakpoints: Record<string, number>
  /** Theme name, for `<name>:` theme variants. */
  themeName?: string
  /** Other theme names, whose variants never match. */
  themeVariants?: string[]
  self: ElementState
  /** Ancestor groups by name (`""` for an unnamed `group`). Nearest wins. */
  groups: Record<string, ElementState>
  /** Sibling peers by name (`""` for an unnamed `peer`). */
  peers?: Record<string, ElementState>
  /** Widths of ancestor query containers by name; `""` is the nearest one. */
  containers?: Record<string, number>
  /** Container query sizes in px (`@sm`, `@md`, ...), from the theme's `--container-*`. */
  containerSizes?: Record<string, number>
  windowHeight?: number
  /** Attrs of ancestors that declared a data-slot, nearest first. */
  ancestors: Attrs[]
  reduceMotion?: boolean
}

export type Pseudo = "placeholder" | "selection" | "svg"
export type VariantResult = boolean | "unsupported" | { pseudo: Pseudo }

/**
 * `[&_svg]`, `[&>svg]` and `[&_svg:not([class*='size-'])]` style descendant icons.
 * On native they set the default icon size/color/stroke for the subtree.
 */
const SVG_VARIANT = /^\[&(?:_|>)svg(?::not\(\[class\*=['"]?size-['"]?\]\))?\]$/

const truthy = (v: Attrs[string]) => v !== undefined && v !== null && v !== false && v !== "false"

/** Shorthand data variants (`data-open`, `data-checked`...), as defined by shadcn/ui and Base UI styles. */
const SHADCN_DATA: Record<string, (a: Attrs) => boolean> = {
  "data-open": (a) => a["data-state"] === "open" || truthy(a["data-open"]),
  "data-closed": (a) => a["data-state"] === "closed" || truthy(a["data-closed"]),
  "data-checked": (a) => a["data-state"] === "checked" || truthy(a["data-checked"]),
  "data-unchecked": (a) => a["data-state"] === "unchecked" || truthy(a["data-unchecked"]),
  "data-selected": (a) => a["data-selected"] === true || a["data-selected"] === "true",
  "data-disabled": (a) => a["data-disabled"] === "true" || truthy(a["data-disabled"]),
  "data-active": (a) => a["data-state"] === "active" || truthy(a["data-active"]),
  "data-horizontal": (a) => a["data-orientation"] === "horizontal",
  "data-vertical": (a) => a["data-orientation"] === "vertical",
}

const ARIA_BOOLEAN = new Set([
  "busy",
  "checked",
  "disabled",
  "expanded",
  "hidden",
  "pressed",
  "readonly",
  "required",
  "selected",
  "invalid",
])

function unbracket(s: string) {
  return s.startsWith("[") && s.endsWith("]") ? s.slice(1, -1).replace(/_/g, " ") : undefined
}

/** Matches an attribute selector body like `state=open`, `size="sm"`, `slot=button-group`. */
function matchAttr(attrs: Attrs, prefix: "data" | "aria", body: string): boolean {
  const m = /^([\w-]+)\s*(\*=|\^=|\$=|~=|=)?\s*"?([^"]*)"?$/.exec(body)
  if (!m) return false
  const [, name, op, expected] = m
  const actual = attrs[`${prefix}-${name}`]
  if (!op) return truthy(actual)
  if (actual === undefined || actual === null) return false
  const a = String(actual)
  switch (op) {
    case "=":
      return a === expected
    case "*=":
      return a.includes(expected)
    case "^=":
      return a.startsWith(expected)
    case "$=":
      return a.endsWith(expected)
    case "~=":
      return a.split(/\s+/).includes(expected)
  }
  return false
}

/** Matches a variant that describes an element's own state. */
function matchState(variant: string, s: ElementState): boolean | "unsupported" {
  switch (variant) {
    case "hover":
      return !!s.hovered
    case "active":
      return !!s.pressed
    case "focus":
    case "focus-within":
      return !!s.focused
    case "focus-visible":
      return !!(s.focusVisible ?? s.focused)
    case "disabled":
      return !!s.disabled || truthy(s.attrs["aria-disabled"])
    case "enabled":
      return !s.disabled
    case "checked":
      return truthy(s.attrs["aria-checked"]) || SHADCN_DATA["data-checked"](s.attrs)
    case "invalid":
    case "user-invalid":
      return truthy(s.attrs["aria-invalid"])
    case "required":
      return truthy(s.attrs["aria-required"])
    case "read-only":
      return truthy(s.attrs["aria-readonly"])
    case "open":
      return truthy(s.attrs["open"]) || SHADCN_DATA["data-open"](s.attrs)
    case "placeholder-shown":
      return truthy(s.attrs["placeholder-shown"])
    case "indeterminate":
      return s.attrs["aria-checked"] === "mixed" || s.attrs["data-state"] === "indeterminate"
    case "optional":
      return !truthy(s.attrs["aria-required"])
    case "valid":
    case "user-valid":
      return !truthy(s.attrs["aria-invalid"])
    case "in-range":
      return true
    // No native equivalent state: these never match.
    case "out-of-range":
    case "default":
    case "autofill":
    case "visited":
    case "target":
      return false
    case "empty":
      return !!s.empty
    case "first":
    case "first-of-type":
      return s.index === 0
    case "last":
    case "last-of-type":
      return s.index !== undefined && s.count !== undefined && s.index === s.count - 1
    case "only":
    case "only-of-type":
      return s.count === 1
    case "odd":
      return s.index !== undefined && s.index % 2 === 0
    case "even":
      return s.index !== undefined && s.index % 2 === 1
  }
  const nth = /^nth-(last-)?(?:of-type-)?(.+)$/.exec(variant)
  if (nth) {
    if (s.index === undefined || s.count === undefined) return false
    const pos = nth[1] ? s.count - s.index : s.index + 1
    return matchNth(unbracket(nth[2]) ?? nth[2], pos)
  }
  if (variant.startsWith("has-")) return matchHas(variant.slice(4), s)
  if (SHADCN_DATA[variant]) return SHADCN_DATA[variant](s.attrs)
  if (variant.startsWith("data-")) {
    const rest = variant.slice(5)
    const body = unbracket(rest) ?? rest
    return matchAttr(s.attrs, "data", body)
  }
  if (variant.startsWith("aria-")) {
    const rest = variant.slice(5)
    const body = unbracket(rest)
    if (body) return matchAttr(s.attrs, "aria", body)
    if (ARIA_BOOLEAN.has(rest)) {
      const v = s.attrs[`aria-${rest}`]
      return v === true || v === "true"
    }
    return false
  }
  return "unsupported"
}

/** `:nth-child()` argument: `3`, `odd`, `2n+1`, `-n+3`. */
function matchNth(expr: string, pos: number): boolean {
  const e = expr.replace(/\s+/g, "")
  if (e === "odd") return pos % 2 === 1
  if (e === "even") return pos % 2 === 0
  if (/^\d+$/.test(e)) return pos === Number(e)
  const m = /^([+-]?\d*)n([+-]\d+)?$/.exec(e)
  if (!m) return false
  const a = m[1] === "" || m[1] === "+" ? 1 : m[1] === "-" ? -1 : Number(m[1])
  const b = m[2] ? Number(m[2]) : 0
  if (a === 0) return pos === b
  const k = (pos - b) / a
  return Number.isInteger(k) && k >= 0
}

/** `has-*`: `has-checked`, `has-data-[slot=x]`, `has-aria-invalid`, `has-[:disabled]`, `has-[[data-x]]`, `has-[svg]`. */
function matchHas(body: string, s: ElementState): boolean | "unsupported" {
  const has = s.has ?? []
  let inner = unbracket(body)
  if (inner === undefined) {
    for (const attrs of has) {
      const r = matchState(body, { attrs })
      if (r === "unsupported") return r
      if (r) return true
    }
    return false
  }
  // Relative selectors: descendants are all we track, so `>` and `*` add nothing.
  inner = inner.replace(/^[>~+]\s*/, "").replace(/^\*/, "").trim()
  if (/^(svg|\[data-icon\])$/.test(inner)) return has.some((a) => a.svg === true)
  const pseudo = /^:([\w-]+)$/.exec(inner)
  if (pseudo) return matchHas(pseudo[1], s)
  const attr = /^\[(data|aria)-([^\]]+)\]$/.exec(inner)
  if (attr) return has.some((a) => matchAttr(a, attr[1] as "data" | "aria", attr[2]))
  return "unsupported"
}

function breakpoint(v: string, env: VariantEnv): boolean | "unsupported" {
  const bp = env.breakpoints
  if (v in bp) return env.windowWidth >= bp[v]
  if (v.startsWith("max-") && v.slice(4) in bp) return env.windowWidth < bp[v.slice(4)]
  const arb = /^(min|max)-\[(\d+(?:\.\d+)?)(px|rem)\]$/.exec(v)
  if (arb) {
    const px = parseFloat(arb[2]) * (arb[3] === "rem" ? 16 : 1)
    return arb[1] === "min" ? env.windowWidth >= px : env.windowWidth < px
  }
  return "unsupported"
}

/** Container queries: `@md`, `@max-sm`, `@min-[400px]`, `@[30rem]`, `@lg/sidebar`. */
function containerQuery(v: string, env: VariantEnv): boolean {
  const [body, name = ""] = splitName(v)
  const width = env.containers?.[name]
  if (width === undefined) return false
  const max = body.startsWith("max-")
  const key = body.replace(/^(max|min)-/, "")
  let px = env.containerSizes?.[key]
  const arb = /^\[(\d+(?:\.\d+)?)(px|rem)\]$/.exec(key)
  if (arb) px = parseFloat(arb[1]) * (arb[2] === "rem" ? 16 : 1)
  if (px === undefined) return false
  return max ? width < px : width >= px
}

/** Rewrites arbitrary variants that have a native meaning (`[&:hover]`, `[&[data-state=open]]`). */
function arbitraryVariant(v: string): string | undefined {
  const inner = v.slice(1, -1)
  const pseudo = /^&:([\w-]+)(?:\((.+)\))?$/.exec(inner)
  if (pseudo) {
    const [, name, arg] = pseudo
    const map: Record<string, string> = {
      "first-child": "first",
      "last-child": "last",
      "only-child": "only",
      "first-of-type": "first",
      "last-of-type": "last",
    }
    if (name === "nth-child" && arg) return `nth-[${arg}]`
    if (name === "nth-last-child" && arg) return `nth-last-[${arg}]`
    return map[name] ?? name
  }
  const attr = /^&\[(data|aria)-(.+)\]$/.exec(inner)
  if (attr) return `${attr[1]}-[${attr[2]}]`
  if (/^\.dark_&$|^:is\(\.dark_\*\)$/.test(inner)) return "dark"
  if (/^@(media|supports)/.test(inner)) return "supports-x"
  return undefined
}

export function matchVariant(variant: string, env: VariantEnv): VariantResult {
  switch (variant) {
    case "dark":
      return env.colorScheme === "dark"
    case "light":
      return env.colorScheme === "light"
    case "ios":
    case "android":
    case "web":
    case "windows":
    case "macos":
      return env.platform === variant
    case "native":
      return env.platform !== "web"
    case "rtl":
      return env.rtl === true
    case "ltr":
      return env.rtl !== true
    case "motion-safe":
      return !env.reduceMotion
    case "motion-reduce":
      return !!env.reduceMotion
    case "pointer-coarse":
    case "any-pointer-coarse":
      return env.platform !== "web"
    case "pointer-fine":
    case "any-pointer-fine":
      return env.platform === "web"
    case "print":
    case "starting":
    case "forced-colors":
    case "contrast-more":
    case "inverted-colors":
      return false
    case "portrait":
      return env.windowHeight === undefined || env.windowHeight >= env.windowWidth
    case "landscape":
      return env.windowHeight !== undefined && env.windowWidth > env.windowHeight
    case "contrast-less":
    case "pointer-none":
    case "any-pointer-none":
    case "noscript":
      return false
    case "placeholder":
      return { pseudo: "placeholder" }
    case "selection":
      return { pseudo: "selection" }
  }
  if (variant === env.themeName) return true
  if (env.themeVariants?.includes(variant)) return false

  if (SVG_VARIANT.test(variant)) return { pseudo: "svg" }
  if (variant.startsWith("[") && variant.endsWith("]")) {
    const mapped = arbitraryVariant(variant)
    return mapped ? matchVariant(mapped, env) : "unsupported"
  }
  if (variant.startsWith("@")) return containerQuery(variant.slice(1), env)

  const bp = breakpoint(variant, env)
  if (bp !== "unsupported") return bp

  if (variant.startsWith("supports-")) return true

  if (variant.startsWith("not-")) {
    const inner = matchVariant(variant.slice(4), env)
    if (typeof inner === "boolean") return !inner
    return "unsupported"
  }

  if (variant.startsWith("group-")) {
    const [body, name = ""] = splitName(variant.slice(6))
    const group = env.groups[name]
    if (!group) return false
    if (body.startsWith("not-")) {
      const r = matchState(body.slice(4), group)
      return typeof r === "boolean" ? !r : r
    }
    return matchState(body, group)
  }

  if (variant.startsWith("peer-")) {
    const [body, name = ""] = splitName(variant.slice(5))
    const peer = env.peers?.[name]
    if (!peer) return false
    if (body.startsWith("not-")) {
      const r = matchState(body.slice(4), peer)
      return typeof r === "boolean" ? !r : r
    }
    return matchState(body, peer)
  }

  if (variant.startsWith("in-")) {
    const body = variant.slice(3)
    for (const attrs of env.ancestors) {
      const r = matchState(body, { attrs })
      if (r === "unsupported") return r
      if (r) return true
    }
    return false
  }

  // Pseudo-elements and browser-only states have no native equivalent.
  if (
    variant === "before" ||
    variant === "after" ||
    variant === "file" ||
    variant === "marker" ||
    variant === "backdrop" ||
    variant === "first-letter" ||
    variant === "first-line" ||
    variant === "details-content" ||
    variant === "inert"
  ) {
    return "unsupported"
  }

  return matchState(variant, env.self)
}

function splitName(s: string): [string, string | undefined] {
  let depth = 0
  for (let i = s.length - 1; i >= 0; i--) {
    const c = s[i]
    if (c === "]" || c === ")") depth++
    else if (c === "[" || c === "(") depth--
    else if (c === "/" && depth === 0) return [s.slice(0, i), s.slice(i + 1)]
  }
  return [s, undefined]
}

/** Which interaction states a variant list depends on, for the element itself. */
export function interactionNeeds(variants: string[]): { press: boolean; hover: boolean; focus: boolean } {
  let press = false
  let hover = false
  let focus = false
  for (const raw of variants) {
    const v = raw.startsWith("not-") ? raw.slice(4) : raw
    if (v === "active") press = true
    else if (v === "hover") hover = true
    else if (v === "focus" || v === "focus-visible" || v === "focus-within") focus = true
  }
  return { press, hover, focus }
}
