import * as React from "react"
import { Pressable, Text, View } from "@astrawind/css"
import { useToc } from "./toc"

/** "On this page": the page's headings, with the one in view highlighted. */
export function OnThisPage() {
  const toc = useToc()
  if (!toc?.items.length) return null
  return (
    <View className="gap-2 px-6 pt-10">
      <Text className="font-mono text-xs/6 font-medium tracking-widest text-gray-500 uppercase dark:text-gray-400">
        On this page
      </Text>
      {toc.items.map((item) => {
        const active = item.id === toc.activeId
        return (
          <Pressable key={item.id} onPress={() => toc.scrollTo(item.id)} className={item.level === 3 ? "pl-4" : ""}>
            <Text
              className={`text-sm/6 ${
                active
                  ? "font-medium text-sky-600 dark:text-sky-400"
                  : "text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {item.title}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
