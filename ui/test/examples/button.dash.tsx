import * as React from "react"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"

export default function ButtonDashExample() {
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Button variant="dash">Default</Button>
      <Button variant="dash" color="primary">Primary</Button>
      <Button variant="dash" color="info">Info</Button>
      <Button variant="dash" color="success">Success</Button>
      <Button variant="dash" color="warning">Warning</Button>
      <Button variant="dash" color="error">Error</Button>
    </View>
  )
}
