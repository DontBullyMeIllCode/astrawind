import * as React from "react"
import { Code, CodeBlock } from "@/site/code"
import { H2, H3, P, Table } from "../prose"

export default function AddingCustomStyles() {
  return (
    <>
      <H2 first>Using arbitrary values</H2>
      <P>
        Use square brackets for one-off values, and parentheses for CSS variables. Arbitrary values support{" "}
        <Code>calc()</Code>, <Code>var()</Code> and any CSS color:
      </P>
      <CodeBlock
        lang="tsx"
        code={`
<View className="top-[117px] w-[calc(100%-2rem)] bg-[#bada55] lg:top-[344px]" />
<View className="bg-(--brand) p-(--card-padding)" />
<Text className="text-[22px] leading-[1.3] tracking-[-0.01em]" />
`}
      />

      <H2>Adding className to any component</H2>
      <P>
        <Code>styled()</Code> adds className to third-party and your own components:
      </P>
      <CodeBlock
        lang="tsx"
        code={`
import { styled } from "@astrawind/css"
import { BlurView } from "expo-blur"
import { Circle } from "lucide-react-native"

const Blur = styled(BlurView)
const Icon = styled(Circle, { kind: "icon" }) // size-* and text-* become size and color props

<Blur className="absolute inset-0 rounded-2xl" />
<Icon className="size-5 text-indigo-500" />
`}
      />
      <Table
        head={["Option", "Description"]}
        rows={[
          [
            "kind",
            "\"view\" (default: text styles pass to descendant text), \"text\", \"input\" (placeholder and selection colors become props), or \"icon\".",
          ],
          ["interactive", "Tracks press, hover and focus for active:, hover: and focus: (set for Pressable and TextInput)."],
          ["classNameProps", "Extra className props mapped to style props, e.g. { contentContainerClassName: \"contentContainerStyle\" }."],
          ["mapStyle", "Moves resolved styles to props for third-party components."],
        ]}
      />

      <H2>Style tokens</H2>
      <P>
        A theme's <Code>styles</Code> define <Code>cn-*</Code> classes that expand to utilities. They rank below plain
        utilities, like Tailwind's components layer, so a component's own classes win:
      </P>
      <CodeBlock
        lang="tsx"
        code={`
const theme = {
  styles: {
    "cn-card": "rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900",
  },
}

<View className="cn-card p-8" /> // p-8 wins over the token's p-6
`}
      />

      <H3>Styles for props</H3>
      <P>
        For props that take a style or a color, resolve a className with <Code>useTw()</Code>. See{" "}
        <Code>Hooks and components</Code>.
      </P>
    </>
  )
}
