import * as React from "react"
import { Text, View } from "@astrawind/css"
import { Separator } from "@astrawind/ui/separator"

export default function SeparatorExample() {
  return (
    <View>
      <View className="gap-1">
        <Text className="text-sm leading-none font-medium">Radix Primitives</Text>
        <Text className="text-sm text-muted-foreground">An open-source UI component library.</Text>
      </View>
      <Separator className="my-4" />
      <View className="h-5 flex-row items-center gap-4">
        <Text className="text-sm">Blog</Text>
        <Separator orientation="vertical" />
        <Text className="text-sm">Docs</Text>
        <Separator orientation="vertical" />
        <Text className="text-sm">Source</Text>
      </View>
    </View>
  )
}
