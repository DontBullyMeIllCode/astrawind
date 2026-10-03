import type { Resolved } from "@astrawind/css/core"

/**
 * What a class does on native, shared by the quick reference tables and
 * scripts/gen-docs.mjs (which counts supported classes for the sidebar).
 */

function formatValue(v: unknown): string {
  if (typeof v === "string") return v
  if (typeof v === "number") return String(Math.round(v * 1000) / 1000)
  return JSON.stringify(v)
}

/** Styles, props, and the other effects the resolver reports. Empty when the class has no native effect. */
export function nativeLines(res: Resolved): string[] {
  const lines = Object.entries(res.style).map(([k, v]) => `${k}: ${formatValue(v)}`)
  for (const [k, v] of Object.entries(res.props)) lines.push(`${k}={${formatValue(v)}}`)
  if (res.animation) lines.push(`animation: ${res.animation}`)
  if (res.transition) lines.push(`transition: ${res.transition.duration}ms`)
  if (res.icon) lines.push(`icon: ${formatValue(res.icon)}`)
  if (res.grid) lines.push(`grid: ${res.grid.cols} columns`)
  if (res.colSpan !== undefined) lines.push(`colSpan: ${res.colSpan}`)
  if (res.divide) lines.push(`divide: ${formatValue(res.divide)}`)
  if (res.vars) for (const [k, v] of Object.entries(res.vars)) lines.push(`--${k}: ${v}`)
  return lines
}

/**
 * Classes that only modify another class (`ring-red-500` colors a `ring`,
 * `grid-cols-2` lays out a `grid`), and the class they're tested with.
 */
const COMPANIONS: [RegExp, string][] = [
  [/^-?inset-ring-/, "inset-ring"],
  [/^-?ring-/, "ring"],
  [/^-?inset-shadow-/, "inset-shadow"],
  [/^-?drop-shadow-/, "drop-shadow"],
  [/^-?text-shadow-/, "text-shadow"],
  [/^-?shadow-/, "shadow"],
  [/^-?outline-/, "outline"],
  [/^-?divide-(?!x|y)/, "divide-y"],
  [/^-?(grid-cols|grid-rows|col-|row-|auto-cols|auto-rows|grid-flow)/, "grid"],
  [/^-?(from|via|to)-/, "bg-linear-to-r"],
  [/^-?decoration-/, "underline"],
  [/^-?(duration|ease|delay)-/, "transition"],
]

/**
 * What a class does on native. A modifier class is resolved with the class it
 * modifies, and its effect is what it adds or changes.
 */
export function nativeEffect(cls: string, resolve: (className: string) => Resolved): string[] {
  const alone = nativeLines(resolve(cls))
  if (alone.length) return alone
  const companion = COMPANIONS.find(([re]) => re.test(cls))?.[1]
  if (!companion) return alone
  const base = new Set(nativeLines(resolve(companion)))
  return nativeLines(resolve(`${companion} ${cls}`)).filter((line) => !base.has(line))
}
