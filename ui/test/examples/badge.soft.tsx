import * as React from "react"
import { View } from "@astrawind/css"
import { Badge } from "@astrawind/ui/badge"

export default function BadgeSoftExample() {
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Badge variant="soft">Default</Badge>
      <Badge variant="soft" color="primary">Primary</Badge>
      <Badge variant="soft" color="info">Info</Badge>
      <Badge variant="soft" color="success">Success</Badge>
      <Badge variant="soft" color="warning">Warning</Badge>
      <Badge variant="soft" color="error">Error</Badge>
    </View>
  )
}
