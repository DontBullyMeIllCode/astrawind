import * as React from "react"
import { ArrowUpIcon, Loader2Icon } from "lucide-react-native"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Icon } from "@astrawind/ui/icon"

export default function ButtonExample() {
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Button>Button</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
      <Button variant="outline" size="icon" aria-label="Submit">
        <Icon as={ArrowUpIcon} />
      </Button>
      <Button size="sm" disabled>
        <Icon as={Loader2Icon} className="animate-spin" />
        Please wait
      </Button>
    </View>
  )
}
