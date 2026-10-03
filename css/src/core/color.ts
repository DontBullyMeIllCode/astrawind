/**
 * Color parsing for AstraWind. React Native understands hex/rgb/hsl but not
 * the oklch/oklab colors Tailwind v4 and shadcn use, so every color is
 * normalized to an RGBA tuple and serialized as `rgba(...)`.
 *
 * Many of Tailwind's oklch colors lie outside sRGB, so their `rgba` is clipped. The
 * unclipped color is remembered (as Display P3) for the web, where browsers show it on
 * wide-gamut screens as they do for CSS's own oklch: see `wideGamutColor`.
 */

export type RGBA = [r: number, g: number, b: number, a: number]

const NAMED: Record<string, RGBA> = {
  transparent: [0, 0, 0, 0],
  black: [0, 0, 0, 1],
  white: [255, 255, 255, 1],
  red: [255, 0, 0, 1],
  green: [0, 128, 0, 1],
  blue: [0, 0, 255, 1],
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

type Vec3 = [number, number, number]

/** sRGB transfer function (also Display P3's), extended to negative values. */
function encode(c: number) {
  const sign = c < 0 ? -1 : 1
  const x = Math.abs(c)
  return sign * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055)
}

function decode(c: number) {
  const sign = c < 0 ? -1 : 1
  const x = Math.abs(c)
  return sign * (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4))
}

function linearToSrgb(c: number) {
  return clamp(Math.round(encode(c) * 255), 0, 255)
}

function oklabToLinearSrgb(L: number, a: number, b: number): Vec3 {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/** Linear sRGB to Display P3 (gamma-encoded, 0–1 inside P3). */
function linearSrgbToP3([r, g, b]: Vec3): Vec3 {
  return [
    encode(0.8224621 * r + 0.177538 * g + 0 * b),
    encode(0.0331941 * r + 0.9668058 * g + 0 * b),
    encode(0.0170827 * r + 0.0723974 * g + 0.9105199 * b),
  ]
}

// Clipped `rgba(...)` string -> the color it stands for, in Display P3 (with alpha).
const WIDE = new Map<string, [number, number, number, number]>()
const WIDE_LIMIT = 4096

function remember(key: string, p3: [number, number, number, number]) {
  if (WIDE.size >= WIDE_LIMIT) WIDE.clear()
  WIDE.set(key, p3)
}

/** Display P3 components of a color string, wide or not. */
function p3Of(input: string): [number, number, number, number] | null {
  const wide = WIDE.get(input)
  if (wide) return [...wide]
  const rgba = parseColor(input)
  if (!rgba) return null
  const lin: Vec3 = [decode(rgba[0] / 255), decode(rgba[1] / 255), decode(rgba[2] / 255)]
  return [...linearSrgbToP3(lin), rgba[3]]
}

function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  const [r, g, bl] = oklabToLinearSrgb(L, a, b)
  return [linearToSrgb(r), linearToSrgb(g), linearToSrgb(bl)]
}

/** Out of sRGB by more than rounding: the channel would clip. */
function outOfSrgb(lin: Vec3) {
  return lin.some((c) => {
    const v = encode(c)
    return v < -0.5 / 255 || v > 1 + 0.5 / 255
  })
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

/** Parses one component, resolving `%` against `percentOf`. */
function num(token: string | undefined, percentOf = 1): number {
  if (!token || token === "none") return 0
  if (token.endsWith("%")) return (parseFloat(token) / 100) * percentOf
  if (token.endsWith("deg")) return parseFloat(token)
  return parseFloat(token)
}

function splitArgs(inner: string): { parts: string[]; alpha?: string } {
  const [main, alpha] = inner.split("/").map((s) => s.trim())
  const parts = main.split(/[\s,]+/).filter(Boolean)
  if (!alpha && parts.length === 4) return { parts: parts.slice(0, 3), alpha: parts[3] }
  return { parts, alpha }
}

export function parseColor(input: string): RGBA | null {
  const value = input.trim().toLowerCase()
  if (NAMED[value]) return [...NAMED[value]]
  if (value === "currentcolor" || value === "inherit") return null

  if (value.startsWith("#")) {
    let hex = value.slice(1)
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join("")
    if (hex.length !== 6 && hex.length !== 8) return null
    const n = parseInt(hex, 16)
    if (hex.length === 6) return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
    return [(n >>> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, (n & 255) / 255]
  }

  const fn = /^([a-z]+)\((.*)\)$/.exec(value)
  if (!fn) return null
  const [, name, inner] = fn
  const { parts, alpha } = splitArgs(inner)
  const a = alpha === undefined ? 1 : clamp(num(alpha), 0, 1)

  switch (name) {
    case "rgb":
    case "rgba":
      return [num(parts[0], 255), num(parts[1], 255), num(parts[2], 255), a].map((v, i) =>
        i < 3 ? clamp(Math.round(v), 0, 255) : v
      ) as RGBA
    case "hsl":
    case "hsla":
      return [...hslToRgb(num(parts[0]), num(parts[1], 100), num(parts[2], 100)), a]
    case "oklch": {
      const L = num(parts[0])
      const C = num(parts[1], 0.4)
      const H = (num(parts[2]) * Math.PI) / 180
      return [...oklabToRgb(L, C * Math.cos(H), C * Math.sin(H)), a]
    }
    case "oklab":
      return [...oklabToRgb(num(parts[0]), num(parts[1], 0.4), num(parts[2], 0.4)), a]
    default:
      return null
  }
}

export function formatColor([r, g, b, a]: RGBA): string {
  const alpha = Math.round(a * 1000) / 1000
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Normalizes any supported CSS color and optionally multiplies its alpha. */
export function toNativeColor(input: string, opacity = 1): string | null {
  const rgba = parseColor(input)
  if (!rgba) return null
  rgba[3] = clamp(rgba[3] * opacity, 0, 1)
  const out = formatColor(rgba)
  // Remember what a clipped oklch/oklab color (or an alpha variant of one) really is.
  const wide = WIDE.get(input.trim()) ?? wideOf(input)
  if (wide) remember(out, [wide[0], wide[1], wide[2], rgba[3]])
  return out
}

/** Display P3 components of an oklch/oklab color outside sRGB. */
function wideOf(input: string): [number, number, number, number] | null {
  const fn = /^(oklch|oklab)\((.*)\)$/i.exec(input.trim())
  if (!fn) return null
  const { parts, alpha } = splitArgs(fn[2])
  const a = alpha === undefined ? 1 : clamp(num(alpha), 0, 1)
  let lin: Vec3
  if (fn[1].toLowerCase() === "oklch") {
    const C = num(parts[1], 0.4)
    const H = (num(parts[2]) * Math.PI) / 180
    lin = oklabToLinearSrgb(num(parts[0]), C * Math.cos(H), C * Math.sin(H))
  } else {
    lin = oklabToLinearSrgb(num(parts[0]), num(parts[1], 0.4), num(parts[2], 0.4))
  }
  if (!outOfSrgb(lin)) return null
  return [...linearSrgbToP3(lin), a]
}

/** Display P3 components (0–1) and alpha of a color the engine clipped to sRGB. */
export function wideGamutComponents(rgba: string): [r: number, g: number, b: number, a: number] | undefined {
  const wide = WIDE.get(rgba)
  if (!wide) return undefined
  return [clamp(wide[0], 0, 1), clamp(wide[1], 0, 1), clamp(wide[2], 0, 1), wide[3]]
}

/**
 * The CSS for a color the engine clipped to sRGB, as `color(display-p3 ...)`; undefined
 * for colors that fit in sRGB. Web only: React Native's color parser doesn't read it.
 */
export function wideGamutColor(rgba: string): string | undefined {
  const wide = WIDE.get(rgba)
  if (!wide) return undefined
  const f = (n: number) => Math.round(clamp(n, 0, 1) * 10000) / 10000
  const alpha = Math.round(wide[3] * 1000) / 1000
  return `color(display-p3 ${f(wide[0])} ${f(wide[1])} ${f(wide[2])}${alpha === 1 ? "" : ` / ${alpha}`})`
}

/** Resolves `color-mix(in <space>, <a> <p>%, <b>)`, mixing in sRGB. */
export function mixColors(a: string, pa: number, b: string): string | null {
  const ca = parseColor(a)
  const cb = parseColor(b)
  if (!ca || !cb) return null
  const t = clamp(pa, 0, 1)
  // Premultiplied, as CSS specifies, so mixing with `transparent` only fades alpha.
  const alpha = ca[3] * t + cb[3] * (1 - t)
  if (alpha === 0) return formatColor([0, 0, 0, 0])
  const ch = (i: number) => Math.round((ca[i] * ca[3] * t + cb[i] * cb[3] * (1 - t)) / alpha)
  const out = formatColor([ch(0), ch(1), ch(2), alpha])
  // A mix with a wide color (e.g. `var(--ring) 50%, transparent`) stays wide, mixed in P3.
  if (WIDE.has(a.trim()) || WIDE.has(b.trim())) {
    const pa3 = p3Of(a.trim())
    const pb3 = p3Of(b.trim())
    if (pa3 && pb3) {
      const mix = (i: number) => (pa3[i] * pa3[3] * t + pb3[i] * pb3[3] * (1 - t)) / alpha
      remember(out, [mix(0), mix(1), mix(2), alpha])
    }
  }
  return out
}
