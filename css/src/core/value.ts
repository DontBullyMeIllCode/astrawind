/**
 * Evaluates CSS values (as they appear in Tailwind's theme and in arbitrary
 * values) into something React Native can use: px numbers, percentage
 * strings, numbers, or rgba colors.
 */
import { mixColors, toNativeColor } from "./color"

export interface ValueEnv {
  /** Looks up a CSS custom property by name, without the leading `--`. */
  getVar(name: string): string | undefined
  rem: number
  /** Current font size in px, for `em`. */
  em: number
  vw: number
  vh: number
  /** Current line height in px, for `lh`. Defaults to 1.5em. */
  lh?: number
}

export type Value =
  | { kind: "length"; px: number }
  | { kind: "percent"; value: number }
  | { kind: "number"; value: number }
  | { kind: "color"; value: string }
  | { kind: "raw"; value: string }

/** Finds the index of the paren that closes the one at `open`. */
function matchParen(s: string, open: number): number {
  let depth = 0
  for (let i = open; i < s.length; i++) {
    if (s[i] === "(") depth++
    else if (s[i] === ")" && --depth === 0) return i
  }
  return -1
}

/** Splits on a separator at paren depth 0. */
export function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === "(" || c === "[") depth++
    else if (c === ")" || c === "]") depth--
    else if (depth === 0 && s.startsWith(sep, i)) {
      out.push(s.slice(start, i))
      start = i + sep.length
    }
  }
  out.push(s.slice(start))
  return out
}

/** Replaces `var(--x, fallback)`, `--spacing(n)`, `--theme(--x)` textually. */
export function substituteVars(input: string, env: ValueEnv, depth = 0): string | undefined {
  if (depth > 20) return undefined
  let s = input
  for (;;) {
    const m = /(var|--spacing|--theme|theme)\(/.exec(s)
    if (!m) return s
    const open = m.index + m[0].length - 1
    const close = matchParen(s, open)
    if (close < 0) return undefined
    const inner = s.slice(open + 1, close)
    let replacement: string | undefined
    if (m[1] === "--spacing") {
      replacement = `calc(var(--spacing) * ${inner})`
    } else {
      const [name, ...fallback] = splitTopLevel(inner, ",")
      const key = name.trim().replace(/^--/, "")
      const raw = env.getVar(key)
      replacement =
        raw !== undefined
          ? substituteVars(raw, env, depth + 1)
          : fallback.length
            ? substituteVars(fallback.join(",").trim(), env, depth + 1)
            : undefined
    }
    if (replacement === undefined) return undefined
    s = s.slice(0, m.index) + replacement + s.slice(close + 1)
  }
}

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

type Num = { n: number; unit: "px" | "%" | "" }

class Parser {
  private i = 0
  constructor(
    private s: string,
    private env: ValueEnv
  ) {}

  parse(): Num {
    const v = this.expr()
    this.ws()
    if (this.i < this.s.length) throw new Error(`Unexpected "${this.s.slice(this.i)}"`)
    return v
  }

  private ws() {
    while (this.s[this.i] === " ") this.i++
  }

  private expr(): Num {
    let left = this.term()
    for (;;) {
      this.ws()
      const op = this.s[this.i]
      if (op !== "+" && op !== "-") return left
      this.i++
      const right = this.term()
      left = combine(left, right, op)
    }
  }

  private term(): Num {
    let left = this.factor()
    for (;;) {
      this.ws()
      const op = this.s[this.i]
      if (op !== "*" && op !== "/") return left
      this.i++
      const right = this.factor()
      if (op === "*") {
        if (left.unit && right.unit) throw new Error("Cannot multiply two lengths")
        left = { n: left.n * right.n, unit: left.unit || right.unit }
      } else {
        if (right.unit) {
          if (right.unit !== left.unit) throw new Error("Cannot divide by a length")
          left = { n: left.n / right.n, unit: "" }
        } else left = { n: left.n / right.n, unit: left.unit }
      }
    }
  }

  private factor(): Num {
    this.ws()
    const rest = this.s.slice(this.i)
    const fn = /^(calc|min|max|clamp)?\(/.exec(rest)
    if (fn) {
      const open = this.i + fn[0].length - 1
      const close = matchParen(this.s, open)
      const inner = this.s.slice(open + 1, close)
      this.i = close + 1
      const args = splitTopLevel(inner, ",").map((a) => new Parser(a.trim(), this.env).parse())
      switch (fn[1]) {
        case "min":
          return args.reduce((a, b) => (compare(a, b) <= 0 ? a : b))
        case "max":
          return args.reduce((a, b) => (compare(a, b) >= 0 ? a : b))
        case "clamp": {
          const [lo, v, hi] = args
          return compare(v, lo) < 0 ? lo : compare(v, hi) > 0 ? hi : v
        }
        default:
          return args[0]
      }
    }
    if (rest[0] === "-" && /^-[a-z(]/.test(rest)) {
      this.i++
      const v = this.factor()
      return { n: -v.n, unit: v.unit }
    }
    const m = /^(-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?)(px|rem|em|lh|ch|%|vw|vh|dvh|svh|lvh|dvw|pt|deg|ms|s)?/.exec(rest)
    if (!m) throw new Error(`Cannot evaluate "${rest}"`)
    this.i += m[0].length
    return toNum(parseFloat(m[1]), m[2], this.env)
  }
}

function toNum(n: number, unit: string | undefined, env: ValueEnv): Num {
  switch (unit) {
    case undefined:
    case "deg":
    case "ms":
      return { n, unit: "" }
    case "s":
      return { n: n * 1000, unit: "" }
    case "px":
      return { n, unit: "px" }
    case "pt":
      return { n: (n * 4) / 3, unit: "px" }
    case "rem":
      return { n: n * env.rem, unit: "px" }
    case "em":
      return { n: n * env.em, unit: "px" }
    case "ch":
      // The width of "0"; half an em is the usual approximation without font metrics.
      return { n: n * env.em * 0.5, unit: "px" }
    case "lh":
      return { n: n * (env.lh ?? env.em * 1.5), unit: "px" }
    case "%":
      return { n, unit: "%" }
    case "vw":
    case "dvw":
      return { n: (n / 100) * env.vw, unit: "px" }
    default:
      return { n: (n / 100) * env.vh, unit: "px" }
  }
}

function combine(a: Num, b: Num, op: "+" | "-"): Num {
  // `0` is unitless in CSS but acts as any length.
  if (a.unit !== b.unit && a.n !== 0 && b.n !== 0 && a.unit && b.unit) {
    throw new Error(`Cannot combine ${a.unit} and ${b.unit}`)
  }
  const unit = a.unit || b.unit
  return { n: op === "+" ? a.n + b.n : a.n - b.n, unit }
}

function compare(a: Num, b: Num) {
  if (a.unit && b.unit && a.unit !== b.unit) throw new Error("Cannot compare mixed units")
  return a.n - b.n
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function resolveColorMix(s: string, env: ValueEnv): string | undefined {
  const m = /^color-mix\(\s*in\s+[a-z-]+\s*,(.*)\)$/i.exec(s)
  if (!m) return undefined
  const [a, b] = splitTopLevel(m[1], ",").map((p) => p.trim())
  const parse = (p: string) => {
    const pm = /^(.*?)\s+(-?[\d.]+)%$/.exec(p)
    return pm ? { color: pm[1], pct: parseFloat(pm[2]) / 100 } : { color: p, pct: undefined }
  }
  const pa = parse(a)
  const pb = parse(b ?? "transparent")
  const ta = pa.pct ?? (pb.pct !== undefined ? 1 - pb.pct : 0.5)
  const ca = evaluate(pa.color, env)
  const cb = evaluate(pb.color, env)
  if (ca?.kind !== "color" || cb?.kind !== "color") return undefined
  return mixColors(ca.value, ta, cb.value) ?? undefined
}

/** Evaluates a CSS value. Returns undefined when it can't be represented natively. */
export function evaluate(input: string, env: ValueEnv): Value | undefined {
  const s = substituteVars(input.trim(), env)
  if (s === undefined) return undefined
  const v = s.trim()
  if (v === "") return undefined

  if (v.startsWith("color-mix(")) {
    const mixed = resolveColorMix(v, env)
    return mixed ? { kind: "color", value: mixed } : undefined
  }
  const color = /^(#|rgb|hsl|oklch|oklab|transparent$|black$|white$)/i.test(v)
    ? toNativeColor(v)
    : null
  if (color) return { kind: "color", value: color }

  if (/^[-\d.(]|^(calc|min|max|clamp)\(/.test(v)) {
    try {
      const n = new Parser(v, env).parse()
      if (n.unit === "px") return { kind: "length", px: n.n }
      if (n.unit === "%") return { kind: "percent", value: n.n }
      return { kind: "number", value: n.n }
    } catch {
      // Not arithmetic (e.g. a multi-part shadow); fall through to raw.
    }
  }
  return { kind: "raw", value: v }
}

/** Evaluates to a px number, `N%` string, or undefined. */
export function toDimension(input: string, env: ValueEnv): number | `${number}%` | undefined {
  const v = evaluate(input, env)
  if (!v) return undefined
  if (v.kind === "length") return v.px
  if (v.kind === "number") return v.value
  if (v.kind === "percent") return `${v.value}%`
  if (v.kind === "raw" && v.value === "auto") return undefined
  return undefined
}

export function toColor(input: string, env: ValueEnv, opacity = 1): string | undefined {
  const v = evaluate(input, env)
  if (v?.kind !== "color") return undefined
  return opacity === 1 ? v.value : (toNativeColor(v.value, opacity) ?? undefined)
}
