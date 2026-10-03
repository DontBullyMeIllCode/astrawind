import * as React from "react"
import { usePathname } from "expo-router"
import { ScrollView, Text, View } from "@astrawind/css"
import { BoxLink } from "../site/link"
import { sections } from "./nav"
import { utilityData } from "./quick-reference"

/**
 * How many of a utility page's classes work on native: green when all of them
 * do, amber when none do.
 */
function NativeCount({ slug }: { slug: string }) {
  const { native, total } = utilityData(slug)
  if (!total) return null
  const tone =
    native === total
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : native === 0
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : "bg-gray-950/5 text-gray-600 dark:bg-white/10 dark:text-gray-400"
  return (
    <Text
      aria-label={`${native} of ${total} classes supported on native`}
      className={`rounded-full px-1.5 font-mono text-[11px]/5 font-medium tabular-nums ${tone}`}
    >
      {native}
    </Text>
  )
}

/** The docs navigation: section headings and page links, like tailwindcss.com's sidebar. */
export function Sidebar({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname()
  return (
    <ScrollView className={className} contentContainerClassName="px-6 pt-8 pb-16 gap-8">
      {sections.map((section) => (
        <View key={section.title} className="gap-3">
          <Text className="font-mono text-xs/6 font-medium tracking-widest text-gray-500 uppercase dark:text-gray-400">
            {section.title}
          </Text>
          <View className="border-l border-gray-950/10 dark:border-white/10">
            {section.pages.map((page) => {
              const active = pathname === `/docs/${page.slug}`
              const child = page.kind === "utility" && page.child
              return (
                <BoxLink
                  key={page.slug}
                  href={`/docs/${page.slug}`}
                  onPress={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`-ml-px flex-row items-center gap-2 border-l py-1 pr-1 ${child ? "pl-8" : "pl-5"} ${
                    active
                      ? "border-sky-500 dark:border-sky-400"
                      : "border-transparent hover:border-gray-950/25 active:border-gray-950/25 dark:hover:border-white/25"
                  }`}
                >
                  <Text
                    className={`flex-1 text-sm/6 ${
                      active
                        ? "font-semibold text-sky-600 dark:text-sky-400"
                        : "text-gray-700 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {page.title}
                  </Text>
                  {page.kind === "utility" && <NativeCount slug={page.slug} />}
                </BoxLink>
              )
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}
