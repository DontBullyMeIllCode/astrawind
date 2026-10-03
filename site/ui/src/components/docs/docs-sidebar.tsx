import * as React from "react"
import { usePathname } from "expo-router"
import { ScrollView, Text, View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import { BoxLink } from "@/components/link"
import { docsNav } from "@/lib/docs"

/** The docs navigation, like ui.shadcn.com's sidebar. */
export function DocsSidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  return (
    <ScrollView className={className} contentContainerClassName="gap-6 px-4 pt-6 pb-16">
      {docsNav.map((section) => (
        <View key={section.title} className="gap-1">
          <Text className="px-2 pb-1 text-xs font-medium text-muted-foreground">{section.title}</Text>
          {section.items.map((item) => {
            const active = pathname === item.href
            return (
              <BoxLink
                key={item.href as string}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "h-8 justify-center rounded-md px-2 hover:bg-accent/50 active:bg-accent/50",
                  active && "bg-accent"
                )}
              >
                <Text className={cn("text-[0.8rem] font-medium", active ? "text-accent-foreground" : "text-foreground/80")}>
                  {item.title}
                </Text>
              </BoxLink>
            )
          })}
        </View>
      ))}
    </ScrollView>
  )
}
