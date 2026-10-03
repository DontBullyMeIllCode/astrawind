import * as React from "react"
import { usePathname } from "expo-router"
import { ScrollView, Text, View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import { Badge } from "@astrawind/ui/badge"
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
  return (
    <Badge
      variant={native === total || native === 0 ? "soft" : "secondary"}
      color={native === total ? "success" : native === 0 ? "warning" : undefined}
      aria-label={`${native} of ${total} classes supported on native`}
      className="h-5 px-1.5 font-mono text-[11px] tabular-nums"
    >
      {String(native)}
    </Badge>
  )
}

/** The docs navigation: section headings and page links, like tailwindcss.com's sidebar. */
export function Sidebar({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname()
  return (
    <ScrollView className={className} contentContainerClassName="px-6 pt-8 pb-16 gap-8">
      {sections.map((section) => (
        <View key={section.title} className="gap-3">
          <Text className="text-xs/6 font-medium text-muted-foreground">{section.title}</Text>
          <View className="border-l">
            {section.pages.map((page) => {
              const active = pathname === `/docs/${page.slug}`
              const child = page.kind === "utility" && page.child
              return (
                <BoxLink
                  key={page.slug}
                  href={`/docs/${page.slug}`}
                  onPress={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-ml-px flex-row items-center gap-2 border-l py-1 pr-1",
                    child ? "pl-8" : "pl-5",
                    active ? "border-link" : "border-transparent hover:border-foreground/25 active:border-foreground/25"
                  )}
                >
                  <Text
                    className={cn(
                      "flex-1 text-sm/6",
                      active ? "font-medium text-link" : "text-muted-foreground hover:text-foreground"
                    )}
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
