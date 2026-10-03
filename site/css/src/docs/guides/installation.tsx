import * as React from "react"
import { Code, CodeBlock } from "@/site/code"
import { TextLink } from "@/site/link"
import { H2, H3, Li, Note, P, Ul } from "../prose"

export default function Installation() {
  return (
    <>
      <H2 first>Installing AstraWind</H2>
      <P>
        AstraWind is Tailwind CSS for React Native. You write <Code>className</Code> the way you would on the web, and it
        resolves each class to native styles at runtime, using Tailwind's own theme values. There's no Babel plugin, no
        Metro transformer and no CSS file to compile.
      </P>

      <H3>Install the package</H3>
      <P>Add it to an Expo or React Native app:</P>
      <CodeBlock lang="sh" title="Terminal" code={`npx expo install @astrawind/css`} />
      <P>
        Tailwind's theme is built in, so <Code>tailwindcss</Code> isn't needed at runtime. This release matches Tailwind
        4.3.3.
      </P>

      <H3>Add the provider</H3>
      <P>
        Wrap your app in <Code>AstraWindProvider</Code>. It works without a theme; pass one to add your own tokens or dark
        mode values. <Code>TextRoot</Code> sets text styles for everything below it, like styles on{" "}
        <Code>{"<body>"}</Code>.
      </P>
      <CodeBlock
        lang="tsx"
        title="app/_layout.tsx"
        code={`
import { AstraWindProvider, TextRoot } from "@astrawind/css"

export default function App() {
  return (
    <AstraWindProvider colorScheme="system">
      <TextRoot className="text-base text-zinc-900 dark:text-zinc-100">
        <Main />
      </TextRoot>
    </AstraWindProvider>
  )
}
`}
      />

      <H3>Start using Tailwind in your components</H3>
      <P>
        Import the className-ready components from <Code>@astrawind/css</Code> and style them with Tailwind's utility
        classes:
      </P>
      <CodeBlock
        lang="tsx"
        title="components/save-card.tsx"
        code={`
import { Pressable, Text, View } from "@astrawind/css"

export function SaveCard() {
  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-white p-4 shadow-md dark:bg-zinc-900">
      <Text className="text-lg font-semibold text-zinc-900 dark:text-white">Hello</Text>
      <Pressable className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 transition active:scale-95 active:bg-indigo-700">
        <Text className="font-medium text-white">Save</Text>
      </Pressable>
    </View>
  )
}
`}
      />
      <P>These components accept className:</P>
      <Ul>
        <Li>
          <Code>View</Code>, <Code>Text</Code>, <Code>Pressable</Code>, <Code>TouchableOpacity</Code>,{" "}
          <Code>TextInput</Code>, <Code>Image</Code>, <Code>ImageBackground</Code>, <Code>KeyboardAvoidingView</Code>,{" "}
          <Code>ActivityIndicator</Code> and <Code>Switch</Code>.
        </Li>
        <Li>
          <Code>ScrollView</Code>, <Code>FlatList</Code> and <Code>SectionList</Code>, which also take{" "}
          <Code>contentContainerClassName</Code> (and <Code>columnWrapperClassName</Code> on <Code>FlatList</Code>).
        </Li>
      </Ul>
      <Note title="Tip">
        Any other component can take className with <Code>styled()</Code>. See{" "}
        <TextLink href="/docs/adding-custom-styles">Adding custom styles</TextLink>.
      </Note>
    </>
  )
}
