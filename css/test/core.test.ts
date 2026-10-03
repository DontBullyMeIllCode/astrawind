import { describe, expect, it } from "vitest"
import { compileTheme, parseColor, resolve, toNativeColor, wideGamutColor, type ResolveEnv } from "../src/core"

const shadcnLight = {
  background: "oklch(1 0 0)",
  foreground: "oklch(0.145 0 0)",
  primary: "oklch(0.205 0 0)",
  "primary-foreground": "oklch(0.985 0 0)",
  border: "oklch(0.922 0 0)",
  input: "oklch(0.922 0 0)",
  ring: "oklch(0.708 0 0)",
  radius: "0.625rem",
}
const theme = {
  name: "artemis",
  vars: {
    "color-background": "var(--background)",
    "color-foreground": "var(--foreground)",
    "color-primary": "var(--primary)",
    "color-primary-foreground": "var(--primary-foreground)",
    "color-border": "var(--border)",
    "color-input": "var(--input)",
    "color-ring": "var(--ring)",
    "radius-md": "calc(var(--radius) * 0.8)",
    "radius-4xl": "calc(var(--radius) * 2.6)",
  },
  light: shadcnLight,
  dark: { ...shadcnLight, background: "oklch(0.145 0 0)" },
  styles: { "cn-button": "rounded-4xl bg-primary px-3 text-primary-foreground" },
}

function env(overrides: Partial<ResolveEnv> = {}): ResolveEnv {
  const scheme = overrides.colorScheme ?? "light"
  const t = compileTheme(theme, scheme)
  return {
    getVar: t.getVar,
    styleMap: t.styles,
    rem: 16,
    em: 16,
    windowWidth: 400,
    windowHeight: 800,
    colorScheme: scheme,
    platform: "ios",
    rtl: false,
    breakpoints: t.breakpoints,
    themeName: "artemis",
    self: { attrs: {} },
    groups: {},
    ancestors: [],
    defaultBorderColor: t.defaultBorderColor,
    ...overrides,
  }
}

const s = (cls: string, o?: Partial<ResolveEnv>) => resolve(cls, env(o)).style

describe("colors", () => {
  it("converts oklch", () => {
    expect(parseColor("oklch(1 0 0)")).toEqual([255, 255, 255, 1])
    expect(parseColor("oklch(0.205 0 0)")?.slice(0, 3)).toEqual([23, 23, 23])
    const red = parseColor("oklch(63.7% 0.237 25.331)")!
    expect(red[0]).toBeGreaterThan(230)
    expect(red[1]).toBeLessThan(60)
  })
  it("parses hex and rgb with alpha", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255, 1])
    expect(parseColor("rgb(0 0 0 / 0.1)")).toEqual([0, 0, 0, 0.1])
  })
  it("applies opacity modifiers", () => {
    expect(s("bg-primary/50").backgroundColor).toBe("rgba(23, 23, 23, 0.5)")
    expect(s("bg-red-500").backgroundColor).toMatch(/^rgba\(2\d\d, /)
    expect(s("text-[#ff0000]").color).toBe("rgba(255, 0, 0, 1)")
  })
  it("remembers oklch colors outside sRGB as Display P3", () => {
    // red-700: its green channel clips in sRGB.
    const clipped = toNativeColor("oklch(0.505 0.213 27.518)")!
    expect(clipped).toBe("rgba(193, 0, 7, 1)")
    expect(wideGamutColor(clipped)).toBe("color(display-p3 0.6927 0.1162 0.1047)")
    // In gamut: nothing to remember.
    expect(wideGamutColor(toNativeColor("oklch(0.985 0 0)")!)).toBeUndefined()
    // Opacity modifiers and mixes with transparent keep the wide color.
    expect(wideGamutColor(toNativeColor(clipped, 0.5)!)).toMatch(/ \/ 0\.5\)$/)
    expect(wideGamutColor(s("bg-red-700/50").backgroundColor as string)).toMatch(/^color\(display-p3 .* \/ 0\.5\)$/)
  })
})

describe("spacing & sizing", () => {
  it("uses the spacing scale", () => {
    expect(s("p-4 mx-2.5 gap-1.5")).toMatchObject({ padding: 16, marginHorizontal: 10, gap: 6 })
    expect(s("-mt-2").marginTop).toBe(-8)
    expect(s("size-9")).toMatchObject({ width: 36, height: 36 })
    expect(s("w-1/2 h-full")).toMatchObject({ width: "50%", height: "100%" })
    expect(s("max-w-md").maxWidth).toBe(448)
    expect(s("w-[calc(100%-2px)]").width).toBeUndefined()
    expect(s("w-[120px] h-(--h) [--h:3rem]")).toMatchObject({ width: 120, height: 48 })
  })
  it("computes self-referencing custom properties against the parent, like CSS", () => {
    const vars = { "radius-xl": "calc(var(--radius) * 1.4)" }
    const r = resolve("[--radius:var(--radius-xl)] rounded-md", env({ getVar: (n) => vars[n as keyof typeof vars] ?? compileTheme(theme, "light").getVar(n) }))
    // --radius = 10px * 1.4 = 14px; rounded-md = 14 * 0.8
    expect(r.vars?.radius).toBe("calc(0.625rem * 1.4)")
    expect(r.style.borderRadius).toBeCloseTo(11.2)
  })
  it("lets later shorthands override earlier longhands, like CSS", () => {
    const st = s("px-4 pt-2 p-0")
    expect(st.padding).toBe(0)
    expect(st.paddingHorizontal).toBeUndefined()
    expect(st.paddingTop).toBeUndefined()
    expect(s("p-0 px-4")).toMatchObject({ padding: 0, paddingHorizontal: 16 })
  })
  it("ignores aspect ratio when width and height are both set, like CSS", () => {
    expect(s("aspect-video h-[200px] w-full").aspectRatio).toBeUndefined()
    expect(s("aspect-video w-full").aspectRatio).toBeCloseTo(16 / 9)
  })
  it("gives wrapping containers CSS's default align-content", () => {
    expect(s("flex-wrap").alignContent).toBe("stretch")
    expect(s("flex-wrap content-start").alignContent).toBe("flex-start")
  })
  it("resolves css vars defined by the element", () => {
    expect(s("gap-(--card-spacing) [--card-spacing:--spacing(6)]").gap).toBe(24)
  })
})

describe("typography", () => {
  it("sets font size with default line height", () => {
    expect(s("text-sm")).toMatchObject({ fontSize: 14, lineHeight: 20 })
    expect(s("text-sm leading-none")).toMatchObject({ fontSize: 14, lineHeight: 14 })
    expect(s("text-base/7").lineHeight).toBe(28)
    expect(s("text-xs tracking-wide").letterSpacing).toBeCloseTo(0.3)
    expect(s("font-medium").fontWeight).toBe("500")
    expect(s("font-heading", { getVar: (n) => ({ "font-heading": "var(--x)", x: "'Inter Variable', sans-serif" })[n] ?? compileTheme(theme, "light").getVar(n) }).fontFamily).toBe("Inter Variable")
  })
  it("maps truncate to props", () => {
    expect(resolve("truncate", env()).props).toMatchObject({ numberOfLines: 1 })
  })
})

describe("borders, radius, effects", () => {
  it("defaults border color to the theme border", () => {
    const st = s("border")
    expect(st.borderWidth).toBe(1)
    expect(st.borderColor).toBe("rgba(229, 229, 229, 1)")
  })
  it("resolves theme radius", () => {
    expect(s("rounded-md").borderRadius).toBe(8)
    expect(s("rounded-4xl").borderRadius).toBe(26)
    expect(s("rounded-[min(var(--radius-md),10px)]").borderRadius).toBe(8)
    expect(s("rounded-t-xl").borderTopLeftRadius).toBeDefined()
    expect(s("rounded-full").borderRadius).toBe(9999)
  })
  it("composes rings and shadows into boxShadow", () => {
    const bs = s("shadow-xs ring-3 ring-ring/50").boxShadow as string
    expect(bs).toContain("0 0 0 3px rgba(161, 161, 161, 0.5)")
    expect(bs).toContain("0px 1px 2px 0px rgba(0, 0, 0, 0.05)")
  })
  it("composes transforms", () => {
    expect(s("-translate-x-1/2 translate-y-px rotate-45 scale-95").transform).toEqual([
      { translateX: "-50%" },
      { translateY: 1 },
      { rotate: "45deg" },
      { scaleX: 0.95 },
      { scaleY: 0.95 },
    ])
  })
})

describe("variants", () => {
  it("applies dark mode", () => {
    expect(s("bg-white dark:bg-black", { colorScheme: "dark" }).backgroundColor).toBe("rgba(0, 0, 0, 1)")
    expect(s("bg-white dark:bg-black").backgroundColor).toBe("rgba(255, 255, 255, 1)")
  })
  it("variant classes win over base classes regardless of order", () => {
    expect(s("active:opacity-50 opacity-100", { self: { attrs: {}, pressed: true } }).opacity).toBe(0.5)
  })
  it("matches data and aria attributes", () => {
    const self = { attrs: { "data-state": "checked", "data-size": "sm", "aria-invalid": true } }
    expect(s("data-checked:bg-primary", { self }).backgroundColor).toBeDefined()
    expect(s("data-[size=sm]:h-4", { self }).height).toBe(16)
    expect(s("aria-invalid:border-2", { self }).borderWidth).toBe(2)
    expect(s("not-data-checked:h-8", { self }).height).toBeUndefined()
  })
  it("matches groups by name", () => {
    const groups = { switch: { attrs: { "data-size": "sm" } } }
    expect(s("group-data-[size=sm]/switch:size-3", { groups }).width).toBe(12)
    expect(s("group-data-[size=default]/switch:size-3", { groups }).width).toBeUndefined()
  })
  it("matches ancestors with in-*", () => {
    const ancestors = [{ "data-slot": "button-group" }]
    expect(s("in-data-[slot=button-group]:rounded-md", { ancestors }).borderRadius).toBe(8)
  })
  it("handles breakpoints and platforms", () => {
    expect(s("p-1 sm:p-2", { windowWidth: 700 }).padding).toBe(8)
    expect(s("p-1 sm:p-2").padding).toBe(4)
    expect(s("android:p-3").padding).toBeUndefined()
    expect(s("ios:p-3").padding).toBe(12)
  })
  it("routes placeholder colors to props", () => {
    expect(resolve("placeholder:text-primary", env()).props.placeholderTextColor).toBeDefined()
  })
  it("reports interaction needs", () => {
    expect(resolve("hover:bg-primary active:opacity-50", env()).needs).toEqual({ press: true, hover: true, focus: false })
  })
  it("collects descendant icon defaults from [&_svg] variants", () => {
    const r = resolve("[&_svg:not([class*='size-'])]:size-4 [&_svg]:text-primary", env())
    expect(r.icon).toEqual({ size: 16, color: "rgba(23, 23, 23, 1)" })
    expect(r.style.width).toBeUndefined()
  })
  it("supports aspect ratio variables", () => {
    expect(s("aspect-(--ratio) [--ratio:16/9]").aspectRatio).toBeCloseTo(16 / 9)
  })
  it("skips unsupported variants", () => {
    const seen: string[] = []
    resolve("[&_img]:size-4 before:p-2 p-1", env({ onUnsupported: (c) => seen.push(c) }))
    expect(seen).toEqual(["[&_img]:size-4", "before:p-2"])
  })
})

describe("theme variants", () => {
  it("matches the current theme's name and ignores the others", () => {
    const seen: string[] = []
    const o = { themeName: "artemis", themeVariants: ["apollo"], onUnsupported: (c: string) => seen.push(c) }
    expect(s("artemis:p-1 apollo:p-2", o).padding).toBe(4)
    expect(s("apollo:p-2", { ...o, themeName: "apollo", themeVariants: ["artemis"] }).padding).toBe(8)
    expect(seen).toEqual([])
  })
})

describe("style tokens", () => {
  it("expands cn-* tokens below utilities", () => {
    const st = s("cn-button rounded-none")
    expect(st.borderRadius).toBe(0)
    expect(st.paddingHorizontal).toBe(12)
  })
  it("flex implies row but flex-col wins", () => {
    expect(s("flex").flexDirection).toBe("row")
    expect(s("flex-col flex").flexDirection).toBe("column")
  })
  it("detects groups", () => {
    expect(resolve("group/button p-1", env()).group).toBe("button")
  })
})

const r = (cls: string, o?: Partial<ResolveEnv>) => resolve(cls, env(o))

describe("effects", () => {
  it("collapses text shadows into React Native's single shadow", () => {
    const st = s("text-shadow-lg")
    expect(st.textShadowOffset).toEqual({ width: 0, height: 4 })
    expect(st.textShadowRadius).toBe(8)
    expect(st.textShadowColor).toBe("rgba(0, 0, 0, 0.271)")
    expect(s("text-shadow-sm text-shadow-red-500").textShadowColor).toMatch(/^rgba\(2\d\d, /)
    expect(s("text-shadow-lg/50").textShadowColor).toBe("rgba(0, 0, 0, 0.136)")
    expect(s("text-shadow-none").textShadowRadius).toBe(0)
  })
  it("combines filter classes in Tailwind's order", () => {
    expect(s("sepia grayscale blur-sm contrast-125 hue-rotate-90").filter).toEqual([
      { blur: 8 },
      { contrast: 1.25 },
      { grayscale: 1 },
      { hueRotate: "90deg" },
      { sepia: 1 },
    ])
    expect(s("blur-sm filter-none").filter).toBeUndefined()
    expect(s("-hue-rotate-15").filter).toEqual([{ hueRotate: "-15deg" }])
  })
  it("maps drop shadows to a filter on Android and layer shadows on iOS", () => {
    expect(s("drop-shadow-md", { platform: "android" }).filter).toEqual([
      { dropShadow: { offsetX: 0, offsetY: 3, standardDeviation: 1.5, color: "rgba(0, 0, 0, 0.12)" } },
    ])
    expect(s("drop-shadow-md")).toMatchObject({
      shadowColor: "rgba(0, 0, 0, 1)",
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 1.5,
    })
  })
  it("resolves *-current against the element's text color", () => {
    expect(s("text-red-500 border border-current").borderColor).toBe(s("text-red-500").color)
    expect(s("border-current", { currentColor: "rgba(1, 2, 3, 1)" }).borderColor).toBe("rgba(1, 2, 3, 1)")
    expect(r("fill-current", { currentColor: "rgba(1, 2, 3, 1)" }).props.fill).toBe("rgba(1, 2, 3, 1)")
    // `text-current` is the inherited color, not the literal `currentColor`.
    expect(s("text-current", { currentColor: "rgba(1, 2, 3, 1)" }).color).toBe("rgba(1, 2, 3, 1)")
    expect(s("ring-2 ring-current text-black").boxShadow).toBe("0 0 0 2px rgba(0, 0, 0, 1)")
  })
  it("resolves the inner shadow and shadow color resets", () => {
    expect(s("shadow-inner").boxShadow).toBe("inset 0px 2px 4px 0px rgba(0, 0, 0, 0.05)")
  })
})

describe("gradients", () => {
  it("builds linear gradients from stops", () => {
    expect(s("bg-linear-to-r from-red-500 to-blue-500").experimental_backgroundImage).toMatch(
      /^linear-gradient\(to right, rgba\(2\d\d, \d+, \d+, 1\) 0%, rgba\(\d+, \d+, 2\d\d, 1\) 100%\)$/
    )
    expect(s("bg-linear-45 from-white via-black via-30% to-white").experimental_backgroundImage).toBe(
      "linear-gradient(45deg, rgba(255, 255, 255, 1) 0%, rgba(0, 0, 0, 1) 30%, rgba(255, 255, 255, 1) 100%)"
    )
    expect(s("bg-gradient-to-b from-black").experimental_backgroundImage).toBe(
      "linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)"
    )
  })
  it("supports radial and arbitrary gradients, converting colors", () => {
    expect(s("bg-radial from-white to-black").experimental_backgroundImage).toBe(
      "radial-gradient(rgba(255, 255, 255, 1) 0%, rgba(0, 0, 0, 1) 100%)"
    )
    expect(s("bg-[linear-gradient(90deg,var(--primary),#fff)]").experimental_backgroundImage).toBe(
      "linear-gradient(90deg,rgba(23, 23, 23, 1),rgba(255, 255, 255, 1))"
    )
    expect(s("bg-linear-to-r from-black bg-none").experimental_backgroundImage).toBeUndefined()
    expect(s("bg-linear-to-r from-black", { platform: "web" }).backgroundImage).toBeDefined()
  })
})

describe("transforms", () => {
  it("orders 3D rotations after translate, rotate and scale", () => {
    expect(s("rotate-x-45 rotate-y-12 translate-x-2 scale-50 skew-3").transform).toEqual([
      { translateX: 8 },
      { scaleX: 0.5 },
      { scaleY: 0.5 },
      { rotateX: "45deg" },
      { rotateY: "12deg" },
      { skewX: "3deg" },
      { skewY: "3deg" },
    ])
  })
  it("applies an ancestor's perspective to 3D rotations", () => {
    const parent = r("perspective-dramatic")
    expect(parent.vars?.["tw-perspective"]).toBe("100")
    expect(s("rotate-x-45", { inheritedVars: parent.vars }).transform).toEqual([{ perspective: 100 }, { rotateX: "45deg" }])
  })
  it("resets individual transforms", () => {
    expect(s("rotate-45 scale-50 rotate-none scale-none").transform).toBeUndefined()
  })
})

describe("logical properties and sizes", () => {
  it("maps block/inline logical utilities", () => {
    expect(s("pbs-2 mbe-4 inset-bs-1 border-be-2")).toMatchObject({
      paddingTop: 8,
      marginBottom: 16,
      top: 4,
      borderBottomWidth: 2,
    })
    expect(s("max-inline-md min-block-10")).toMatchObject({ maxWidth: 448, minHeight: 40 })
  })
  it("resolves lh, fractions and leading-px", () => {
    expect(s("h-lh", { lineHeight: 20 }).height).toBe(20)
    expect(s("flex-1/2")).toMatchObject({ flexGrow: 1, flexShrink: 1, flexBasis: "50%" })
    expect(s("text-sm leading-px").lineHeight).toBe(1)
  })
  it("routes placeholder colors with the v3 utility", () => {
    expect(r("placeholder-red-500").props.placeholderTextColor).toMatch(/^rgba/)
  })
})

describe("children", () => {
  it("hands *: and **: classes to children", () => {
    const res = r("*:p-2 dark:*:bg-black **:text-sm hover:**:underline")
    expect(res.childClass).toBe("p-2")
    expect(res.descendantClass).toBe("text-sm")
    expect(r("dark:*:bg-black", { colorScheme: "dark" }).childClass).toBe("bg-black")
    expect(r("[&>*]:p-1 [&_*]:p-3")).toMatchObject({ childClass: "p-1", descendantClass: "p-3" })
  })
  it("describes divide borders", () => {
    expect(r("divide-y-2 divide-red-500 divide-dashed").divide).toMatchObject({ y: 2, style: "dashed" })
    expect(r("divide-x divide-x-reverse").divide).toMatchObject({ x: 1, xReverse: true })
    expect(r("divide-x").divide?.color).toBe("rgba(229, 229, 229, 1)")
  })
  it("emulates grid columns with a wrapping row", () => {
    const res = r("grid grid-cols-3 gap-4")
    expect(res.grid).toEqual({ cols: 3, gap: 16 })
    expect(res.style).toMatchObject({ flexDirection: "row", flexWrap: "wrap" })
    expect(r("grid grid-cols-[repeat(2,minmax(0,1fr))]").grid?.cols).toBe(2)
    expect(r("grid-cols-3").grid).toBeUndefined()
    expect(r("col-span-2").colSpan).toBe(2)
  })
  it("marks containers and peers", () => {
    expect(r("@container/card p-2")).toMatchObject({ container: "card" })
    expect(r("peer/email")).toMatchObject({ peer: "email" })
  })
})

describe("more variants", () => {
  it("matches sibling position", () => {
    const at = (index: number, count = 4) => ({ self: { attrs: {}, index, count } })
    expect(s("first:mt-0", at(0)).marginTop).toBe(0)
    expect(s("first:mt-0", at(1)).marginTop).toBeUndefined()
    expect(s("last:mb-0", at(3)).marginBottom).toBe(0)
    expect(s("odd:p-1 even:p-2", at(0)).padding).toBe(4)
    expect(s("odd:p-1 even:p-2", at(1)).padding).toBe(8)
    expect(s("nth-3:p-1", at(2)).padding).toBe(4)
    expect(s("nth-[2n+1]:p-1", at(2)).padding).toBe(4)
    expect(s("nth-last-2:p-1", at(2)).padding).toBe(4)
    expect(s("only:p-1", at(0, 1)).padding).toBe(4)
    expect(s("not-first:border-t", at(1)).borderTopWidth).toBe(1)
    expect(s("[&:first-child]:p-1", at(0)).padding).toBe(4)
    expect(s("first:mt-0").marginTop).toBeUndefined()
  })
  it("matches descendants with has-*", () => {
    const self = { attrs: {}, has: [{ "data-slot": "card-footer" }, { "aria-checked": true }, { svg: true }] }
    expect(s("has-data-[slot=card-footer]:pb-0", { self }).paddingBottom).toBe(0)
    expect(s("has-checked:bg-black", { self }).backgroundColor).toBe("rgba(0, 0, 0, 1)")
    expect(s("has-[svg]:px-2", { self }).paddingHorizontal).toBe(8)
    expect(s("has-[>[data-slot=card-footer]]:pb-1", { self }).paddingBottom).toBe(4)
    expect(s("has-disabled:opacity-50", { self }).opacity).toBeUndefined()
    const groups = { "": self }
    expect(s("group-has-[:checked]:p-1", { groups }).padding).toBe(4)
  })
  it("matches peers", () => {
    const peers = { "": { attrs: { "aria-invalid": true } }, email: { attrs: {}, focused: true } }
    expect(s("peer-invalid:text-red-500", { peers }).color).toBeDefined()
    expect(s("peer-focus/email:p-1", { peers }).padding).toBe(4)
    expect(s("peer-focus:p-1", { peers }).padding).toBeUndefined()
    expect(s("peer-not-invalid:p-1", { peers }).padding).toBeUndefined()
  })
  it("matches container queries", () => {
    const t = compileTheme(theme, "light")
    const o = { containers: { "": 500, sidebar: 250 }, containerSizes: t.containerSizes }
    expect(s("@md:p-1", o).padding).toBe(4)
    expect(s("@xl:p-1", o).padding).toBeUndefined()
    expect(s("@max-xl:p-1", o).padding).toBe(4)
    expect(s("@sm/sidebar:p-1", o).padding).toBeUndefined()
    expect(s("@[200px]/sidebar:p-1", o).padding).toBe(4)
    expect(s("@md:p-1").padding).toBeUndefined()
  })
  it("matches orientation, empty and other native states", () => {
    expect(s("portrait:p-1 landscape:p-2").padding).toBe(4)
    expect(s("portrait:p-1 landscape:p-2", { windowWidth: 900, windowHeight: 400 }).padding).toBe(8)
    expect(s("empty:hidden", { self: { attrs: {}, empty: true } }).display).toBe("none")
    expect(s("indeterminate:p-1", { self: { attrs: { "aria-checked": "mixed" } } }).padding).toBe(4)
    expect(s("visited:p-1").padding).toBeUndefined()
    expect(s("[&[data-state=open]]:p-1", { self: { attrs: { "data-state": "open" } } }).padding).toBe(4)
    expect(s("[&:hover]:p-1", { self: { attrs: {}, hovered: true } }).padding).toBe(4)
  })
})

describe("transitions", () => {
  it("resolves transition groups, duration, easing and delay", () => {
    expect(r("transition").transition).toEqual({
      groups: ["colors", "opacity", "transform"],
      duration: 150,
      easing: [0.4, 0, 0.2, 1],
      delay: 0,
    })
    expect(r("transition-colors duration-300 ease-in delay-75").transition).toEqual({
      groups: ["colors"],
      duration: 300,
      easing: [0.4, 0, 1, 1],
      delay: 75,
    })
    expect(r("transition-[opacity,width] ease-linear duration-[1s]").transition).toMatchObject({
      groups: ["opacity", "layout"],
      easing: "linear",
      duration: 1000,
    })
    expect(r("transition transition-none").transition).toBeUndefined()
  })
})
