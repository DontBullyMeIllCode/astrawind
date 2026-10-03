import * as React from "react"
import Head from "expo-router/head"
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context"
import { Pressable, ScrollView, styled, Text, View } from "@astrawind/css"
import cssPackage from "@astrawind/css/package.json"
import { pages } from "@/docs/nav"
import { TAILWIND_VERSION } from "@/docs/quick-reference"
import { CodeBlock } from "@/site/code"
import { Header } from "@/site/header"
import { BoxLink } from "@/site/link"

const SafeAreaView = styled(RNSafeAreaView)

const DEMO = `
<View className="flex-row items-center gap-3 rounded-xl bg-white p-4 shadow-md dark:bg-zinc-900">
  <Text className="text-lg font-semibold text-zinc-900 dark:text-white">Hello</Text>
  <Pressable className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 transition active:scale-95 active:bg-indigo-700">
    <Text className="font-medium text-white">Save</Text>
  </Pressable>
</View>
`

const FEATURES = [
  {
    title: "Every Tailwind class resolves",
    body: "The test suite runs every class and variant Tailwind generates, 23,000+, and fails if any is unknown. Classes with no native equivalent are accepted as deliberate no-ops.",
  },
  {
    title: "No build step",
    body: "No Babel plugin or CSS compilation: classes are parsed when they render, and the results are cached.",
  },
  {
    title: "CSS semantics, not approximations",
    body: "Custom properties with var(), calc(), inheriting text styles, oklch() colors, group-*, peer-* and has-*, container queries and transitions.",
  },
  {
    title: "Tailwind's own theme",
    body: "The same spacing, colors, radii, shadows and type scale as the web, generated from the installed Tailwind release.",
  },
]

function Demo() {
  const [saved, setSaved] = React.useState(0)
  return (
    <View className="gap-4 lg:flex-row">
      <View className="justify-center rounded-2xl bg-gray-100 p-8 lg:w-2/5 dark:bg-white/5">
        <View className="flex-row items-center gap-3 rounded-xl bg-white p-4 shadow-md dark:bg-zinc-900">
          <Text className="text-lg font-semibold text-zinc-900 dark:text-white">{saved ? `Saved ×${saved}` : "Hello"}</Text>
          <Pressable
            onPress={() => setSaved((n) => n + 1)}
            className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 transition active:scale-95 active:bg-indigo-700"
          >
            <Text className="font-medium text-white">Save</Text>
          </Pressable>
        </View>
      </View>
      <View className="flex-1">
        <CodeBlock lang="tsx" title="save-card.tsx" code={DEMO} className="h-full" />
      </View>
    </View>
  )
}

export default function Home() {
  const utilities = pages.filter((p) => p.kind === "utility").length
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white dark:bg-gray-950">
      <Head>
        <title>AstraWind - Tailwind CSS for React Native</title>
        <meta name="description" content="Write className the way you would on the web. AstraWind resolves every Tailwind class to native styles at runtime." />
      </Head>
      <Header version={cssPackage.version} />
      <ScrollView contentContainerClassName="items-center px-4 pb-24 sm:px-6">
        <View className="w-full max-w-5xl">
          <View className="items-start gap-6 pt-16 pb-12 sm:pt-24">
            <View className="rounded-full bg-sky-500/10 px-3 py-1 ring-1 ring-sky-500/20">
              <Text className="font-mono text-xs font-medium text-sky-700 dark:text-sky-300">
                Matches Tailwind {TAILWIND_VERSION}
              </Text>
            </View>
            <Text role="heading" aria-level={1} className="text-5xl font-semibold tracking-tighter text-gray-950 sm:text-7xl dark:text-white">
              Tailwind CSS for React Native.
            </Text>
            <Text className="max-w-2xl text-lg/8 text-gray-600 dark:text-gray-400">
              Write className the way you would on the web. AstraWind resolves every class to native styles at runtime,
              with Tailwind's own theme values. No build step, no approximations.
            </Text>
            <View className="flex-row flex-wrap items-center gap-4">
              <BoxLink href="/docs/installation" className="rounded-full bg-gray-950 px-5 py-2.5 hover:bg-gray-800 active:bg-gray-800 dark:bg-white dark:hover:bg-gray-200">
                <Text className="text-sm font-semibold text-white dark:text-gray-950">Get started</Text>
              </BoxLink>
              <View className="rounded-full px-4 py-2.5 ring-1 ring-gray-950/10 dark:ring-white/10">
                <Text selectable className="font-mono text-sm text-gray-700 dark:text-gray-300">
                  npx expo install @astrawind/css
                </Text>
              </View>
            </View>
          </View>

          <Demo />

          <View className="mt-20 gap-x-10 gap-y-10 sm:flex-row sm:flex-wrap">
            {FEATURES.map((f) => (
              <View key={f.title} className="gap-2 sm:w-[46%]">
                <Text className="text-base font-semibold text-gray-950 dark:text-white">{f.title}</Text>
                <Text className="text-sm/6 text-gray-600 dark:text-gray-400">{f.body}</Text>
              </View>
            ))}
          </View>

          <View className="mt-20 flex-row flex-wrap items-center justify-between gap-6 rounded-2xl bg-gray-950 p-8 sm:p-10 dark:bg-white/5">
            <View className="max-w-md gap-2">
              <Text className="text-2xl font-semibold tracking-tight text-white">Every utility, documented for native.</Text>
              <Text className="text-sm/6 text-gray-400">
                {utilities} utility pages list each class with its CSS and what it becomes on React Native.
              </Text>
            </View>
            <BoxLink href="/docs/padding" className="rounded-full bg-white px-5 py-2.5 hover:bg-gray-200 active:bg-gray-200">
              <Text className="text-sm font-semibold text-gray-950">Browse the docs</Text>
            </BoxLink>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
