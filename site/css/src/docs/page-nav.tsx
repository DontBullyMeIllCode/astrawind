import * as React from "react"
import { Text, View } from "@astrawind/css"
import { BoxLink } from "../site/link"
import { pages } from "./nav"

/** Previous and next pages, in sidebar order. */
export function PageNav({ slug }: { slug: string }) {
  const i = pages.findIndex((p) => p.slug === slug)
  const prev = pages[i - 1]
  const next = pages[i + 1]
  return (
    <View className="mt-16 flex-row justify-between gap-4 border-t border-gray-950/10 pt-8 dark:border-white/10">
      {prev ? (
        <BoxLink href={`/docs/${prev.slug}`} className="shrink gap-1">
          <Text className="text-xs text-gray-500">Previous</Text>
          <Text className="text-sm font-semibold text-gray-950 hover:text-sky-600 dark:text-white">← {prev.title}</Text>
        </BoxLink>
      ) : (
        <View />
      )}
      {next && (
        <BoxLink href={`/docs/${next.slug}`} className="shrink items-end gap-1">
          <Text className="text-xs text-gray-500">Next</Text>
          <Text className="text-sm font-semibold text-gray-950 hover:text-sky-600 dark:text-white">{next.title} →</Text>
        </BoxLink>
      )}
    </View>
  )
}
