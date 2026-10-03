import * as React from "react"
import { CalendarIcon, SparklesIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Icon } from "@astrawind/ui/icon"
import { Marker, MarkerContent, MarkerIcon } from "@astrawind/ui/marker"

export default function MarkerExample() {
  return (
    <View className="w-full max-w-md gap-6">
      <Marker>
        <MarkerIcon>
          <Icon as={SparklesIcon} />
        </MarkerIcon>
        <MarkerContent>Generated with AI</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerIcon>
          <Icon as={CalendarIcon} />
        </MarkerIcon>
        <MarkerContent>
          Updated 2 days ago. <Text className="text-foreground underline underline-offset-3">View history</Text>
        </MarkerContent>
      </Marker>
      <Marker>Plain text marker</Marker>
    </View>
  )
}
