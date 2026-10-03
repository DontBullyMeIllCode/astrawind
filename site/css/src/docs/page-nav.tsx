import * as React from "react"
import { Link } from "expo-router"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Icon } from "@astrawind/ui/icon"
import { Separator } from "@astrawind/ui/separator"
import { pages } from "./nav"

/** Previous and next pages, in sidebar order. */
export function PageNav({ slug }: { slug: string }) {
  const i = pages.findIndex((p) => p.slug === slug)
  const prev = pages[i - 1]
  const next = pages[i + 1]
  return (
    <View className="mt-16 gap-8">
      <Separator />
      <View className="flex-row justify-between gap-4">
        {prev ? (
          <Link href={`/docs/${prev.slug}`} asChild>
            <Button variant="secondary" size="sm" aria-label={`Previous: ${prev.title}`} className="shrink">
              <Icon as={ArrowLeftIcon} />
              <Text numberOfLines={1}>{prev.title}</Text>
            </Button>
          </Link>
        ) : (
          <View />
        )}
        {next && (
          <Link href={`/docs/${next.slug}`} asChild>
            <Button variant="secondary" size="sm" aria-label={`Next: ${next.title}`} className="shrink">
              <Text numberOfLines={1}>{next.title}</Text>
              <Icon as={ArrowRightIcon} />
            </Button>
          </Link>
        )}
      </View>
    </View>
  )
}
