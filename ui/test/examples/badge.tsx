import * as React from "react"
import { BadgeCheckIcon } from "lucide-react-native"
import { View } from "@astrawind/css"
import { Badge } from "@astrawind/ui/badge"
import { Icon } from "@astrawind/ui/icon"

export default function BadgeExample() {
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Badge>Badge</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="secondary" className="bg-blue-500 text-white dark:bg-blue-600">
        <Icon as={BadgeCheckIcon} />
        Verified
      </Badge>
      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">8</Badge>
    </View>
  )
}
