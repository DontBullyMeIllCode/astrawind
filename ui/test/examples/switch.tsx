import * as React from "react"
import { View } from "@astrawind/css"
import { Label } from "@astrawind/ui/label"
import { Switch } from "@astrawind/ui/switch"

export default function SwitchExample() {
  const [checked, setChecked] = React.useState(true)
  return (
    <View className="flex flex-col gap-4">
      <View className="flex items-center gap-2">
        <Switch nativeID="airplane-mode" />
        <Label htmlFor="airplane-mode">Airplane Mode</Label>
      </View>
      <View className="flex items-center gap-2">
        <Switch nativeID="wifi" checked={checked} onCheckedChange={setChecked} />
        <Label htmlFor="wifi">Wi-Fi</Label>
      </View>
      <View className="flex items-center gap-2">
        <Switch nativeID="small" size="sm" defaultChecked />
        <Label htmlFor="small">Small</Label>
      </View>
      <View className="flex items-center gap-2">
        <Switch nativeID="disabled" disabled />
        <Label htmlFor="disabled" disabled>
          Disabled
        </Label>
      </View>
    </View>
  )
}
