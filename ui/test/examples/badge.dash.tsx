import * as React from "react"
import { View } from "@astrawind/css"
import { Badge } from "@astrawind/ui/badge"

export default function BadgeDashExample() {
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Badge variant="dash">Default</Badge>
      <Badge variant="dash" color="primary">Primary</Badge>
      <Badge variant="dash" color="info">Info</Badge>
      <Badge variant="dash" color="success">Success</Badge>
      <Badge variant="dash" color="warning">Warning</Badge>
      <Badge variant="dash" color="error">Error</Badge>
    </View>
  )
}
