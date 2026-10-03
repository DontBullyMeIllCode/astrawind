import * as React from "react"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"

export default function ButtonSoftExample() {
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Button variant="soft">Default</Button>
      <Button variant="soft" color="primary">Primary</Button>
      <Button variant="soft" color="info">Info</Button>
      <Button variant="soft" color="success">Success</Button>
      <Button variant="soft" color="warning">Warning</Button>
      <Button variant="soft" color="error">Error</Button>
    </View>
  )
}
