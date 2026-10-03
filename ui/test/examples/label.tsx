import * as React from "react"
import { View } from "@astrawind/css"
import { Input } from "@astrawind/ui/input"
import { Label } from "@astrawind/ui/label"

export default function LabelExample() {
  return (
    <View className="gap-2">
      <Label htmlFor="name">Your name</Label>
      <Input nativeID="name" placeholder="Jane Doe" />
      <Label disabled>Disabled label</Label>
    </View>
  )
}
