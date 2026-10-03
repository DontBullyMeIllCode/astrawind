import * as React from "react"
import { Text, View } from "@astrawind/css"
import { DirectionProvider, useDirection } from "@astrawind/ui/direction"

function CurrentDirection({ label }: { label: string }) {
  const dir = useDirection()
  return (
    <Text className="text-sm">
      {label}: <Text className="font-medium">{dir}</Text>
    </Text>
  )
}

export default function DirectionExample() {
  return (
    <View className="gap-2">
      <CurrentDirection label="Default" />
      <DirectionProvider direction="rtl">
        <CurrentDirection label="direction=rtl" />
        <DirectionProvider dir="ltr">
          <CurrentDirection label="Nested dir=ltr" />
        </DirectionProvider>
      </DirectionProvider>
    </View>
  )
}
