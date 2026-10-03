import * as React from "react"
import { Text, View } from "@astrawind/css"

export function SiteFooter() {
  return (
    <View className="border-t px-4 py-6 lg:px-6">
      <Text className="text-center text-sm/6 text-muted-foreground">
        Built with @astrawind/ui and @astrawind/css. Components ported from shadcn/ui (MIT).
      </Text>
    </View>
  )
}
