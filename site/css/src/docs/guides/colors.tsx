import * as React from "react"
import { Text, View } from "@astrawind/css"
import { Code, CodeBlock } from "@/site/code"
import { H2, P } from "../prose"

const PALETTE = [
  "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo",
  "violet", "purple", "fuchsia", "pink", "rose", "slate", "gray", "zinc", "neutral", "stone", "taupe", "mauve", "mist", "olive",
]
const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]

function Swatches() {
  return (
    <View className="my-6 gap-1.5">
      <View className="flex-row gap-1.5 pl-20">
        {SHADES.map((s) => (
          <Text key={s} className="flex-1 text-center font-mono text-[10px] text-muted-foreground">
            {s}
          </Text>
        ))}
      </View>
      {PALETTE.map((color) => (
        <View key={color} className="flex-row items-center gap-1.5">
          <Text className="w-20 font-mono text-xs text-foreground/80">{color}</Text>
          {SHADES.map((s) => (
            <View
              key={s}
              aria-label={`${color}-${s}`}
              className={`aspect-square flex-1 rounded-sm bg-${color}-${s} ring-1 ring-foreground/10 ring-inset`}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

export default function Colors() {
  return (
    <>
      <H2 first>Default color palette</H2>
      <P>
        Tailwind's palette is built in, in the same <Code>oklch()</Code> values, converted to colors React Native can draw.
        These swatches are rendered by AstraWind from classes like <Code>bg-sky-500</Code>:
      </P>
      <Swatches />

      <H2>Working with colors</H2>
      <P>
        Every color utility takes the palette: <Code>bg-*</Code>, <Code>text-*</Code>, <Code>border-*</Code>,{" "}
        <Code>ring-*</Code>, <Code>shadow-*</Code>, <Code>fill-*</Code>, <Code>stroke-*</Code>,{" "}
        <Code>decoration-*</Code>, <Code>placeholder:text-*</Code>, gradients and more.
      </P>
      <P>
        Adjust opacity with a modifier: <Code>bg-black/75</Code>, <Code>text-sky-500/[0.3]</Code> or{" "}
        <Code>bg-pink-500/(--my-alpha)</Code>.
      </P>
      <CodeBlock
        lang="tsx"
        code={`
<View className="rounded-xl bg-sky-500/10 p-4 ring-1 ring-sky-500/20">
  <Text className="text-sky-700 dark:text-sky-300">Opacity modifiers work on every color utility.</Text>
</View>
`}
      />

      <H2>Customizing your colors</H2>
      <P>
        Add colors with <Code>color-*</Code> theme variables, in any CSS color format, including <Code>color-mix()</Code>:
      </P>
      <CodeBlock
        lang="tsx"
        code={`
const theme = {
  vars: {
    "color-midnight": "#121063",
    "color-tahiti": "oklch(0.72 0.11 221.19)",
    "color-tahiti-muted": "color-mix(in oklab, var(--color-tahiti) 50%, transparent)",
  },
}
`}
      />
    </>
  )
}
