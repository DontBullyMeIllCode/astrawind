import * as React from "react"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"

export default function ButtonColorsExample() {
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Button color="primary">Primary</Button>
      <Button color="info">Info</Button>
      <Button color="success">Success</Button>
      <Button color="warning">Warning</Button>
      <Button color="error">Error</Button>
    </View>
  )
}
