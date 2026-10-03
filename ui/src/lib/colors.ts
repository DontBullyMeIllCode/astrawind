/**
 * Colors and styles beyond shadcn's variants, after daisyUI: a `color` (primary, or a status
 * color) and the `soft` and `dash` styles, which components combine with their own variants.
 *
 *   soft  a tint of the color (8% over the background, 10% for the border), in the color
 *   dash  a dashed border in the color, transparent inside
 *
 * Interactive components (Button) fill with the solid color on hover and press, as daisyUI does.
 */

export const COLORS = ["primary", "info", "success", "warning", "error"] as const
export type Color = (typeof COLORS)[number]

/** `color-mix(in oklab, var(--c) p%, var(--background))`: an opaque tint of the color. */
const tint = (c: string, pct: number) => `[color-mix(in_oklab,var(--${c})_${pct}%,var(--background))]`

/** Classes for one color: what `bg-*`, `text-*` and `border-*` need for each style. */
export function colorClasses(c: Color) {
  // Status colors are styled like shadcn's `destructive`: white text on the color, 60% in dark mode.
  const status = c !== "primary"
  return {
    solid: status ? `bg-${c} text-${c}-foreground dark:bg-${c}/60` : `bg-${c} text-${c}-foreground`,
    /** Hover/press on a solid fill, and its focus ring. */
    solidPress: status
      ? `hover:bg-${c}/90 active:bg-${c}/90 focus-visible:ring-${c}/20 dark:focus-visible:ring-${c}/40`
      : `hover:bg-${c}/90 active:bg-${c}/90`,
    outline: `border border-${c} bg-transparent text-${c}`,
    soft: `border bg-${tint(c, 8)} border-${tint(c, 10)} text-${c}`,
    dash: `border border-dashed border-${c} bg-transparent text-${c}`,
    ghost: `text-${c}`,
    ghostPress: `hover:bg-${c}/10 active:bg-${c}/10`,
    link: `text-${c}`,
    /** daisyUI's hover/press for outline, soft and dash: the solid color. */
    fill: `hover:border-solid hover:border-${c} hover:bg-${c} hover:text-${c}-foreground active:border-solid active:border-${c} active:bg-${c} active:text-${c}-foreground`,
    /** The fill in dark mode, as the solid style shows it. Goes after `fill` (and `dark(fill)`). */
    fillDark: status ? `dark:hover:bg-${c}/60 dark:active:bg-${c}/60` : "",
    /** Muted text in the color (descriptions). */
    muted: `text-${c}/90`,
    /** The same classes under `dark:`, to win over a variant's own `dark:` classes. */
    dark: (classes: string) =>
      classes
        .split(/\s+/)
        .filter(Boolean)
        .map((cls) => `dark:${cls}`)
        .join(" "),
  }
}

/** `soft` and `dash` without a color: in the foreground color, like daisyUI's base content. */
export const neutralStyles = {
  soft: `border bg-${tint("foreground", 8)} border-${tint("foreground", 10)} text-foreground`,
  dash: "border border-dashed border-foreground/40 bg-transparent text-foreground",
  press: `hover:bg-${tint("foreground", 14)} active:bg-${tint("foreground", 14)}`,
}

/**
 * cva `compoundVariants` for every color: `classes(color)` gives the classes for each of the
 * component's variants (by variant name), or undefined where the color doesn't apply.
 */
export function colorCompounds<V extends string>(
  classes: (c: ReturnType<typeof colorClasses>) => Partial<Record<V, string>>
) {
  return COLORS.flatMap((color) =>
    Object.entries(classes(colorClasses(color)) as Record<V, string | undefined>)
      .filter(([, className]) => className)
      .map(([variant, className]) => ({ variant: variant as V, color, className: className as string }))
  )
}
