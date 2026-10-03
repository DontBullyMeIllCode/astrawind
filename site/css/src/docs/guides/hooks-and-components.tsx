import * as React from "react"
import { Code, CodeBlock } from "@/site/code"
import { H2, P, Table } from "../prose"

export default function HooksAndComponents() {
  return (
    <>
      <H2 first>AstraWindProvider</H2>
      <Table
        head={["Prop", "Description"]}
        rows={[
          ["theme", "Your theme variables, fonts and style tokens. See Theme variables."],
          ["colorScheme", "\"light\", \"dark\" or \"system\" (default)."],
          ["warnUnsupported", "Warn once per class that can't apply. Defaults to __DEV__."],
        ]}
      />

      <H2>TextRoot</H2>
      <P>
        Sets inherited text styles for a subtree, like styles on <Code>{"<body>"}</Code>. Use it at the root; it's also
        where portalled overlays should mount.
      </P>
      <CodeBlock lang="tsx" code={`<TextRoot className="font-sans text-base text-foreground">…</TextRoot>`} />

      <H2>useTw()</H2>
      <P>Resolves a className inside a component, for props that take a style or a color:</P>
      <CodeBlock
        lang="tsx"
        code={`
const tw = useTw()
<RefreshControl tintColor={tw("text-sky-500").color as string} />
<Animated.View style={[tw("rounded-xl bg-white p-4"), animatedStyle]} />
`}
      />

      <H2>useCurrentColor()</H2>
      <P>
        Returns the inherited text color, like <Code>currentColor</Code>, e.g. to tint a native control.
      </P>

      <H2>IconStyle</H2>
      <P>
        Sets the default icon size, color and stroke width for icons below it, the native stand-in for{" "}
        <Code>[&_svg]:size-4</Code>:
      </P>
      <CodeBlock lang="tsx" code={`<IconStyle size={16} color="#71717a">…</IconStyle>`} />

      <H2>clearStyleCache()</H2>
      <P>Clears cached styles, e.g. after hot-reloading a theme.</P>
    </>
  )
}
