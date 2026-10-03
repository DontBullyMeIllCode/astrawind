import * as React from "react"
import { View } from "@astrawind/css"
import { Input } from "@astrawind/ui/input"

export default function InputExample() {
  return (
    <View className="w-full max-w-sm gap-3">
      <Input placeholder="Email" keyboardType="email-address" />
      <Input placeholder="Disabled" editable={false} />
      <Input placeholder="Invalid" aria-invalid />
    </View>
  )
}
