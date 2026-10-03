import { splitTopLevel } from "./value"

export interface ParsedClass {
  raw: string
  /** Variants in source order, outermost first (`dark:hover:x` → ["dark", "hover"]). */
  variants: string[]
  important: boolean
  negative: boolean
  /** Utility without variants, `!` or leading `-`, e.g. `bg-primary/50`. */
  utility: string
}

const cache = new Map<string, ParsedClass | null>()

export function parseClass(raw: string): ParsedClass | null {
  const hit = cache.get(raw)
  if (hit !== undefined) return hit
  const parts = splitTopLevel(raw, ":")
  let utility = parts.pop() ?? ""
  let important = false
  if (utility.startsWith("!")) {
    important = true
    utility = utility.slice(1)
  } else if (utility.endsWith("!")) {
    important = true
    utility = utility.slice(0, -1)
  }
  let negative = false
  if (utility.startsWith("-") && !utility.startsWith("--")) {
    negative = true
    utility = utility.slice(1)
  }
  const parsed = utility
    ? { raw, variants: parts, important, negative, utility }
    : null
  cache.set(raw, parsed)
  return parsed
}

/** Splits a className string into class tokens, respecting brackets. */
export function splitClassName(className: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = -1
  for (let i = 0; i <= className.length; i++) {
    const c = className[i]
    const ws = c === undefined || c === " " || c === "\n" || c === "\t"
    if (c === "[" || c === "(") depth++
    else if (c === "]" || c === ")") depth--
    if (ws && depth <= 0) {
      if (start >= 0) out.push(className.slice(start, i))
      start = -1
    } else if (start < 0) start = i
  }
  return out
}

/**
 * Splits `value/modifier` at the last top-level slash. Fractions (`1/2`) are
 * returned whole since they're a value, not a modifier.
 */
export function splitModifier(value: string): [value: string, modifier: string | undefined] {
  const parts = splitTopLevel(value, "/")
  if (parts.length < 2) return [value, undefined]
  // `w-1/2` also splits into ["w-1", "2"]; size utilities re-join fractions.
  const modifier = parts.pop()!
  return [parts.join("/"), modifier]
}

/** Converts Tailwind's arbitrary-value syntax (`[calc(100%_-_2px)]`) to CSS. */
export function decodeArbitrary(value: string): string | undefined {
  if (value.startsWith("[") && value.endsWith("]")) {
    let v = value.slice(1, -1)
    // Type hints like `[length:var(--x)]` or `[color:red]`.
    const hint = /^(length|color|number|percentage|url|image|position|family-name|size|line-width|integer|angle|ratio|vector|bg-size|absolute-size|relative-size|any|shadow):(.*)$/.exec(
      v
    )
    if (hint) v = hint[2]
    return v.replace(/(?<!\\)_/g, " ").replace(/\\_/g, "_")
  }
  if (value.startsWith("(") && value.endsWith(")")) {
    // v4 shorthand: `w-(--my-width)` means `w-[var(--my-width)]`.
    const inner = value.slice(1, -1).replace(/^[a-z-]+:/, "")
    return `var(${inner})`
  }
  return undefined
}
