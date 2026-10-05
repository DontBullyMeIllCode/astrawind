import * as React from "react"
import { Text, View } from "@astrawind/css"
import { BoxLink } from "@/components/link"
import { Seo } from "@/components/seo"

export default function NotFound() {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      <Seo title="Page not found - astrawind/ui" noindex />
      <Text role="heading" aria-level={1} className="text-3xl font-semibold tracking-tight">
        Page not found
      </Text>
      <Text className="text-muted-foreground">There's no page at this address.</Text>
      <BoxLink href="/">
        <Text className="font-medium underline underline-offset-4">Back to home</Text>
      </BoxLink>
    </View>
  )
}
