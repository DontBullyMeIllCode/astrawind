import * as React from "react"
import { View } from "@astrawind/css"
import { Badge } from "@astrawind/ui/badge"

export default function BadgeColorsExample() {
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Badge color="primary">Primary</Badge>
      <Badge color="info">Info</Badge>
      <Badge color="success">Success</Badge>
      <Badge color="warning">Warning</Badge>
      <Badge color="error">Error</Badge>
    </View>
  )
}
