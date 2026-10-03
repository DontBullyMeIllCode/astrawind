import * as React from "react"
import { Text, toNativeColor, View } from "@astrawind/css"
import { baseColors, themeColors } from "@astrawind/ui"
import { CodeBlock, Code } from "@/components/code-block"
import { DocsPage } from "@/components/docs/docs-page"
import { H2, H3, P } from "@/components/docs/prose"
import { guides } from "@/lib/docs"

function Swatches({ names, colors }: { names: string[]; colors: Record<string, { light: Record<string, string> }> }) {
  return (
    <View className="my-4 flex-row flex-wrap gap-3">
      {names.map((name) => (
        <View key={name} className="items-center gap-1.5">
          <View
            className="size-10 rounded-lg border"
            style={{ backgroundColor: toCss(colors[name].light.primary ?? colors[name].light.foreground) }}
          />
          <Text className="text-xs text-muted-foreground">{name}</Text>
        </View>
      ))}
    </View>
  )
}

const STATUS = ["info", "success", "warning", "error"] as const

/** The status colors, from the current theme (`bg-info` and so on), in light or dark mode. */
function StatusSwatches() {
  return (
    <View className="my-4 flex-row flex-wrap gap-3">
      {STATUS.map((name) => (
        <View key={name} className="items-center gap-1.5">
          <View className={`size-10 rounded-lg border bg-${name}`} />
          <Text className="text-xs text-muted-foreground">{name}</Text>
        </View>
      ))}
    </View>
  )
}

/** shadcn's colors are oklch(); convert them for React Native. */
const toCss = (color: string | undefined) => (color ? (toNativeColor(color) ?? undefined) : undefined)

export default function Theming() {
  const page = guides[2]
  return (
    <DocsPage title={page.title} description={page.description}>
      <P>
        Components are styled with shadcn's semantic classes, like <Code>bg-primary</Code> and{" "}
        <Code>text-muted-foreground</Code>. Their colors come from CSS variables that <Code>ThemeProvider</Code> sets for
        light and dark mode, the same variables <Code>npx shadcn init</Code> writes to your CSS.
      </P>

      <H2>Base colors</H2>
      <P>The base color sets the neutrals: backgrounds, borders, muted text.</P>
      <Swatches names={Object.keys(baseColors)} colors={baseColors} />
      <CodeBlock code={`<ThemeProvider baseColor="zinc">…</ThemeProvider>`} />

      <H2>Theme colors</H2>
      <P>A theme color is layered over the base color: primary, charts and the sidebar's primary.</P>
      <Swatches names={Object.keys(themeColors)} colors={themeColors} />
      <CodeBlock code={`<ThemeProvider baseColor="neutral" themeColor="blue">…</ThemeProvider>`} />

      <H2>Status colors</H2>
      <P>
        Beyond shadcn's palette, <Code>info</Code>, <Code>success</Code>, <Code>warning</Code> and <Code>error</Code>, each
        with a <Code>-foreground</Code>, as in daisyUI. They're styled exactly like shadcn's <Code>destructive</Code>:
        white text on the color, with the color at 60% in dark mode. <Code>error</Code> is{" "}
        <Code>--destructive</Code>, so the two are identical. The shades are Tailwind's, picked so white text has at least
        4.5:1 contrast in both modes. Use them as classes (<Code>bg-success</Code>, <Code>text-warning</Code>) or through
        the components' <Code>color</Code> prop.
      </P>
      <StatusSwatches />
      <CodeBlock
        code={`
<Button color="success">Save</Button>
<Badge variant="soft" color="info">New</Badge>
<Alert variant="dash" color="warning">…</Alert>
<Card variant="dash">…</Card>
`}
      />

      <H3>Soft and dash</H3>
      <P>
        Button, Badge and Alert take daisyUI's <Code>soft</Code> (a tint of the color) and <Code>dash</Code> (a dashed
        outline) variants, in any of the colors: <Code>primary</Code>, <Code>info</Code>, <Code>success</Code>,{" "}
        <Code>warning</Code> and <Code>error</Code>. The color also applies to <Code>default</Code>,{" "}
        <Code>outline</Code>, <Code>ghost</Code> and <Code>link</Code>. Without a color, soft and dash use the foreground.
        Card takes <Code>variant="dash"</Code> too: a dashed border without the shadow. Override the status colors with{" "}
        <Code>cssVars</Code>, like any other variable.
      </P>

      <H2>Radius</H2>
      <P>
        <Code>--radius</Code> sets the corner radius the components derive <Code>rounded-sm</Code> to{" "}
        <Code>rounded-4xl</Code> from.
      </P>
      <CodeBlock code={`<ThemeProvider radius="0.5rem">…</ThemeProvider>`} />

      <H2>Your own variables</H2>
      <P>
        Pass variables in shadcn's registry shape, <Code>{"{ theme, light, dark }"}</Code>, without the leading{" "}
        <Code>--</Code>. Use any CSS color, including <Code>oklch()</Code>:
      </P>
      <CodeBlock
        code={`
<ThemeProvider
  cssVars={{
    theme: { "color-brand": "var(--brand)" },
    light: { primary: "oklch(0.55 0.2 265)", brand: "oklch(0.84 0.16 84)" },
    dark: { primary: "oklch(0.7 0.15 265)", brand: "oklch(0.41 0.11 46)" },
  }}
>
  …
</ThemeProvider>
// className="bg-brand"
`}
      />
      <H3>Try it</H3>
      <P>The Create page lets you pick a base color, theme, chart colors and radius, and gives you the provider code.</P>
    </DocsPage>
  )
}
