import * as React from "react"
import { Link } from "expo-router"
import { ArrowRightIcon } from "lucide-react-native"
import { Pressable, ScrollView, Text, View } from "@astrawind/css"
import { Badge } from "@astrawind/ui/badge"
import { Button } from "@astrawind/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@astrawind/ui/card"
import { Icon } from "@astrawind/ui/icon"
import { pages } from "@/docs/nav"
import { TAILWIND_VERSION } from "@/docs/quick-reference"
import { CodeBlock } from "@/site/code"
import { Seo } from "@/site/seo"

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
      {/* The example itself is plain Tailwind, rendered by @astrawind/css from the code beside it. */}
      <View className="justify-center rounded-xl border bg-muted/40 p-8 lg:w-2/5 dark:bg-muted/20">
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
        <CodeBlock lang="tsx" title="save-card.tsx" code={DEMO} className="my-0 h-full" />
      </View>
    </View>
  )
}

export default function Home() {
  const utilities = pages.filter((p) => p.kind === "utility").length
  return (
    <ScrollView className="flex-1" contentContainerClassName="items-center px-4 pb-24 sm:px-6">
      <Seo
        title="AstraWind - Tailwind CSS for React Native"
        description="Write className the way you would on the web. AstraWind resolves every Tailwind class to native styles at runtime."
        path="/"
      />
      <View className="w-full max-w-5xl">
        <View className="items-start gap-6 pt-16 pb-12 sm:pt-24">
          <Badge variant="soft" color="primary" className="font-mono">
            Matches Tailwind {TAILWIND_VERSION}
          </Badge>
          <Text role="heading" aria-level={1} className="text-5xl font-semibold tracking-tighter sm:text-7xl">
            Tailwind CSS for React Native.
          </Text>
          <Text className="max-w-2xl text-lg/8 text-muted-foreground">
            Write className the way you would on the web. AstraWind resolves every class to native styles at runtime,
            with Tailwind's own theme values. No build step, no approximations.
          </Text>
          <View className="flex-row flex-wrap items-center gap-3">
            <Link href="/docs/installation" asChild>
              <Button size="lg">
                Get started
                <Icon as={ArrowRightIcon} />
              </Button>
            </Link>
            <View className="h-10 justify-center rounded-md border px-4">
              <Text selectable className="font-mono text-sm text-muted-foreground">
                npx expo install @astrawind/css
              </Text>
            </View>
          </View>
        </View>

        <Demo />

        <View className="mt-20 gap-4 sm:flex-row sm:flex-wrap">
          {FEATURES.map((f) => (
            <Card key={f.title} className="sm:w-[48%] sm:grow">
              <CardHeader>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription className="text-sm/6">{f.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </View>

        <View className="mt-20 flex-row flex-wrap items-center justify-between gap-6 rounded-xl bg-primary p-8 sm:p-10">
          <View className="max-w-md gap-2">
            <Text className="text-2xl font-semibold tracking-tight text-primary-foreground">Every utility, documented for native.</Text>
            <Text className="text-sm/6 text-primary-foreground/80">
              {utilities} utility pages list each class with its CSS and what it becomes on React Native.
            </Text>
          </View>
          <Link href="/docs/padding" asChild>
            <Button variant="secondary" size="lg">
              Browse the docs
            </Button>
          </Link>
        </View>
      </View>
    </ScrollView>
  )
}
