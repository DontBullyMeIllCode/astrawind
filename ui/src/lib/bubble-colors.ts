import { parseColor } from "@astrawind/css"

/**
 * CSS relative color `oklch(from <color> <l> calc(c * <chromaScale>) h)`, which
 * @astrawind/css doesn't resolve: keeps the hue, sets lightness, scales chroma.
 * Returns an `rgba(...)` string without spaces (usable in `bg-[...]`).
 */
export function relativeOklch(color: string | undefined, lightness: number, chromaScale: number): string | undefined {
  const rgba = color ? parseColor(color) : null
  if (!rgba) return undefined
  const [r, g, b, alpha] = rgba
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [lr, lg, lb] = [lin(r), lin(g), lin(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const scale = chromaScale
  const a = A * scale
  const bb = B * scale
  const L = lightness
  const l_ = L + 0.3963377774 * a + 0.2158037573 * bb
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bb
  const s_ = L - 0.0894841775 * a - 1.291485548 * bb
  const [l3, m3, s3] = [l_ ** 3, m_ ** 3, s_ ** 3]
  const out = [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ].map((c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
    return Math.min(255, Math.max(0, Math.round(v * 255)))
  })
  return `rgba(${out[0]},${out[1]},${out[2]},${Math.round(alpha * 1000) / 1000})`
}
