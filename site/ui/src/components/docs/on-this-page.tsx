import * as React from "react"
import { Pressable, Text, View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import { useToc } from "./toc"

/** "On This Page": the page's headings, with the one in view highlighted. */
export function OnThisPage() {
  const toc = useToc()
  if (!toc?.items.length) return null
  return (
    <View className="gap-2 px-4 pt-10">
      <Text className="text-xs font-medium text-muted-foreground">On This Page</Text>
      {toc.items.map((item) => (
        <Pressable key={item.id} onPress={() => toc.scrollTo(item.id)} className={item.level === 3 ? "pl-4" : ""}>
          <Text
            className={cn(
              "text-[0.8rem]",
              item.id === toc.activeId ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
