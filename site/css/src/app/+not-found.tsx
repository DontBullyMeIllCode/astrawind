import * as React from "react"
import { Text, View } from "@astrawind/css"
import { TextLink } from "@/site/link"
import { Seo } from "@/site/seo"

export default function NotFound() {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      <Seo title="Page not found - AstraWind" noindex />
      <Text role="heading" aria-level={1} className="text-3xl font-semibold tracking-tight">
        Page not found
      </Text>
      <Text className="text-muted-foreground">
        There's no page at this address. Start with <TextLink href="/docs/installation">Installation</TextLink>.
      </Text>
    </View>
  )
}
