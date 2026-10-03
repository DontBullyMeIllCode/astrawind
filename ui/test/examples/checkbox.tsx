import * as React from "react"
import { Text, View } from "@astrawind/css"
import { Checkbox, type CheckedState } from "@astrawind/ui/checkbox"
import { Label } from "@astrawind/ui/label"

export default function CheckboxExample() {
  const [checked, setChecked] = React.useState<CheckedState>("indeterminate")
  return (
    <View className="flex flex-col gap-6">
      <View className="flex items-center gap-3">
        <Checkbox nativeID="terms" />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </View>
      <View className="flex items-start gap-3">
        <Checkbox nativeID="terms-2" defaultChecked />
        <View className="grid gap-2">
          <Label htmlFor="terms-2">Accept terms and conditions</Label>
          <Text className="text-sm text-muted-foreground">By clicking this checkbox, you agree to the terms and conditions.</Text>
        </View>
      </View>
      <View className="flex items-start gap-3">
        <Checkbox nativeID="toggle" disabled />
        <Label htmlFor="toggle" disabled>
          Enable notifications
        </Label>
      </View>
      <View className="flex items-center gap-3">
        <Checkbox nativeID="select-all" checked={checked} onCheckedChange={setChecked} />
        <Label htmlFor="select-all">Select all</Label>
      </View>
      <View className="flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
        <Checkbox
          nativeID="toggle-2"
          defaultChecked
          className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
        />
        <View className="grid gap-1.5 font-normal">
          <Text nativeID="toggle-2" className="text-sm leading-none font-medium">
            Enable notifications
          </Text>
          <Text className="text-sm text-muted-foreground">You can enable or disable notifications at any time.</Text>
        </View>
      </View>
    </View>
  )
}
