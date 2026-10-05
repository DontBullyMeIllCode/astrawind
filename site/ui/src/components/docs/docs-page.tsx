import * as React from "react"
import { usePathname } from "expo-router"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Icon } from "@astrawind/ui/icon"
import { BoxLink } from "@/components/link"
import { Seo } from "@/components/seo"
import { neighbours } from "@/lib/docs"

/** Title, description and previous/next buttons, like ui.shadcn.com's docs pages. */
export function DocsPage({
  title,
  description,
  noindex,
  children,
}: {
  title: string
  description: string
  noindex?: boolean
  children?: React.ReactNode
}) {
  const pathname = usePathname()
  const { prev, next } = neighbours(pathname)
  return (
    <View>
      <Seo title={`${title} - astrawind/ui`} description={description} noindex={noindex} />
      <View className="flex-row items-start justify-between gap-4">
        <Text role="heading" aria-level={1} className="flex-1 text-3xl font-semibold tracking-tight">
          {title}
        </Text>
        <View className="flex-row gap-2">
          {prev && (
            <BoxLink href={prev.href} aria-label={`Previous: ${prev.title}`}>
              <Button variant="secondary" size="icon-sm" className="pointer-events-none">
                <Icon as={ArrowLeftIcon} />
              </Button>
            </BoxLink>
          )}
          {next && (
            <BoxLink href={next.href} aria-label={`Next: ${next.title}`}>
              <Button variant="secondary" size="icon-sm" className="pointer-events-none">
                <Icon as={ArrowRightIcon} />
              </Button>
            </BoxLink>
          )}
        </View>
      </View>
      <Text className="mt-3 text-base text-balance text-muted-foreground">{description}</Text>
      <View className="mt-4">{children}</View>
      <View className="mt-12 flex-row justify-between gap-4">
        {prev ? (
          <BoxLink href={prev.href}>
            <Button variant="secondary" size="sm" className="pointer-events-none">
              <Icon as={ArrowLeftIcon} />
              {prev.title}
            </Button>
          </BoxLink>
        ) : (
          <View />
        )}
        {next && (
          <BoxLink href={next.href}>
            <Button variant="secondary" size="sm" className="pointer-events-none">
              {next.title}
              <Icon as={ArrowRightIcon} />
            </Button>
          </BoxLink>
        )}
      </View>
    </View>
  )
}
