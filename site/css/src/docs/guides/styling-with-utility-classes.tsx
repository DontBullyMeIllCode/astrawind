import * as React from "react"
import { Text, View } from "@astrawind/css"
import { Code, CodeBlock } from "@/site/code"
import { TextLink } from "@/site/link"
import { H2, H3, Li, P, Preview, Ul } from "../prose"

export default function StylingWithUtilityClasses() {
  return (
    <>
      <H2 first>Overview</H2>
      <P>
        You style components by combining many single-purpose classes directly in <Code>className</Code>. This card is
        rendered by AstraWind, on this page, from the code below it:
      </P>
      <Preview>
        <View className="w-full max-w-sm flex-row items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10">
          <View className="size-12 shrink-0 items-center justify-center rounded-full bg-sky-500">
            <Text className="text-lg font-bold text-white">A</Text>
          </View>
          <View>
            <Text className="text-xl font-medium text-black dark:text-white">ChitChat</Text>
            <Text className="text-gray-500 dark:text-gray-400">You have a new message!</Text>
          </View>
        </View>
      </Preview>
      <CodeBlock
        lang="tsx"
        code={`
<View className="w-full max-w-sm flex-row items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10">
  <View className="size-12 shrink-0 items-center justify-center rounded-full bg-sky-500">
    <Text className="text-lg font-bold text-white">A</Text>
  </View>
  <View>
    <Text className="text-xl font-medium text-black dark:text-white">ChitChat</Text>
    <Text className="text-gray-500 dark:text-gray-400">You have a new message!</Text>
  </View>
</View>
`}
      />
      <P>
        Every class here is Tailwind's, with Tailwind's values: <Code>p-6</Code> is 24 points of padding,{" "}
        <Code>rounded-xl</Code> a 12-point radius, <Code>shadow-lg</Code> the same box shadow as on the web, and{" "}
        <Code>ring-1</Code> a one-point ring drawn as a box shadow.
      </P>

      <H2>Why utility classes on native</H2>
      <Ul>
        <Li>You don't name styles or keep a StyleSheet next to every component.</Li>
        <Li>Changes stay local: removing a class can't break another screen.</Li>
        <Li>The same classes work in your web app, in shadcn-style components, and in your editor's Tailwind tooling.</Li>
      </Ul>

      <H3>Where React Native differs</H3>
      <P>
        Layout is flexbox, and a <Code>View</Code> is a column by default, as in React Native. <Code>flex</Code> and{" "}
        <Code>inline-flex</Code> set a row, as they do on the web. Text must be inside <Code>Text</Code>, but text styles set
        on a <Code>View</Code> cascade to the text inside it, as in CSS. See{" "}
        <TextLink href="/docs/preflight">Preflight</TextLink>.
      </P>

      <H2>Using arbitrary values</H2>
      <P>
        When you need a value outside the theme, use square brackets:{" "}
        <Code>{'className="top-[117px] bg-[#bada55] grid-cols-[repeat(3,1fr)]"'}</Code>. Custom properties work with
        parentheses, like <Code>bg-(--brand)</Code>. See <TextLink href="/docs/adding-custom-styles">Adding custom styles</TextLink>.
      </P>
    </>
  )
}
