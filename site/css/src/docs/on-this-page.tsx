import * as React from "react"
import { Pressable, Text, View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import { useToc } from "./toc"

/** "On this page": the page's headings, with the one in view highlighted. */
export function OnThisPage() {
  const toc = useToc()
  if (!toc?.items.length) return null
  return (
    <View className="gap-2 px-6 pt-10">
      <Text className="text-xs/6 font-medium text-muted-foreground">On this page</Text>
      {toc.items.map((item) => {
        const active = item.id === toc.activeId
        return (
          <Pressable key={item.id} onPress={() => toc.scrollTo(item.id)} className={item.level === 3 ? "pl-4" : ""}>
            <Text
              className={cn("text-sm/6", active ? "font-medium text-link" : "text-muted-foreground hover:text-foreground")}
            >
              {item.title}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
