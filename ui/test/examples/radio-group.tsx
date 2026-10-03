import * as React from "react"
import { View } from "@astrawind/css"
import { Label } from "@astrawind/ui/label"
import { RadioGroup, RadioGroupItem } from "@astrawind/ui/radio-group"

export default function RadioGroupExample() {
  const [value, setValue] = React.useState("comfortable")
  return (
    <View className="flex flex-col gap-8">
      <RadioGroup defaultValue="comfortable">
        <View className="flex items-center gap-3">
          <RadioGroupItem value="default" nativeID="r1" />
          <Label htmlFor="r1">Default</Label>
        </View>
        <View className="flex items-center gap-3">
          <RadioGroupItem value="comfortable" nativeID="r2" />
          <Label htmlFor="r2">Comfortable</Label>
        </View>
        <View className="flex items-center gap-3">
          <RadioGroupItem value="compact" nativeID="r3" disabled />
          <Label htmlFor="r3" disabled>
            Compact
          </Label>
        </View>
      </RadioGroup>
      <RadioGroup value={value} onValueChange={setValue} className="flex-row">
        <View className="flex items-center gap-3">
          <RadioGroupItem value="comfortable" nativeID="r4" />
          <Label htmlFor="r4" onPress={() => setValue("comfortable")}>
            Controlled
          </Label>
        </View>
        <View className="flex items-center gap-3">
          <RadioGroupItem value="other" nativeID="r5" aria-invalid />
          <Label htmlFor="r5" onPress={() => setValue("other")}>
            Invalid
          </Label>
        </View>
      </RadioGroup>
    </View>
  )
}
