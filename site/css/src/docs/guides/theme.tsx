import * as React from "react"
import { Code, CodeBlock } from "@/site/code"
import { H2, H3, P, Table } from "../prose"

export default function Theme() {
  return (
    <>
      <H2 first>Overview</H2>
      <P>
        A theme is a set of CSS variables, the same ones you'd put in Tailwind's <Code>@theme</Code>, without the leading{" "}
        <Code>--</Code>. Tailwind's default theme is built in; yours extends or overrides it:
      </P>
      <CodeBlock
        lang="tsx"
        code={`
import { AstraWindProvider, type AstraWindTheme } from "@astrawind/css"

const theme: AstraWindTheme = {
  // Always applied. Extends or overrides Tailwind's defaults.
  vars: {
    "color-brand": "var(--brand)",
    "font-sans": "Inter",
    "radius-lg": "0.75rem",
  },
  // Applied in light or dark mode.
  light: { brand: "oklch(0.55 0.2 265)" },
  dark: { brand: "oklch(0.7 0.15 265)" },
}

<AstraWindProvider theme={theme} colorScheme="system">…</AstraWindProvider>
// className="bg-brand text-white rounded-lg"
`}
      />
      <P>
        Variables create utilities by namespace, as in Tailwind: <Code>color-*</Code> gives <Code>bg-*</Code>,{" "}
        <Code>text-*</Code>, <Code>border-*</Code> and the other color utilities; <Code>radius-*</Code> gives{" "}
        <Code>rounded-*</Code>; <Code>spacing</Code> scales <Code>p-*</Code>, <Code>m-*</Code>, <Code>gap-*</Code> and
        sizes; <Code>breakpoint-*</Code> adds responsive variants.
      </P>

      <H2>Theme options</H2>
      <Table
        head={["Option", "Description"]}
        rows={[
          ["vars, light, dark", "CSS variables. Colors can be any CSS color (oklch, hsl, hex, color-mix())."],
          [
            "fonts",
            "(family, weight, style) => style: maps a CSS font family and weight to a native font name, since native fonts are usually registered per weight.",
          ],
          ["rem", "Root font size in px. Defaults to 16."],
          [
            "name, themeVariants",
            "A theme named \"brand\" enables brand: variants; list your other themes' names in themeVariants so their variants don't match.",
          ],
          ["styles", "Style tokens: cn-* classes that expand to utility classes, ranked below plain utilities (like a component layer)."],
        ]}
      />

      <H3>Default border color</H3>
      <P>
        If your theme defines <Code>--color-border</Code>, it becomes the default border color, as with the common{" "}
        <Code>{"* { border-color: var(--color-border) }"}</Code> base style. Otherwise borders default to{" "}
        <Code>currentColor</Code>.
      </P>
    </>
  )
}
