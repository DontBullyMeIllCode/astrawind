import * as React from "react"
import { Text, View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@astrawind/ui/hover-card"

export default function HoverCardExample() {
  return (
    <View className="flex-row gap-2">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="link">@nextjs</Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <View className="flex-row justify-between gap-4">
            <View className="size-10 items-center justify-center rounded-full bg-muted">
              <Text className="text-sm">VC</Text>
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold">@nextjs</Text>
              <Text className="text-sm">The React Framework – created and maintained by @vercel.</Text>
              <Text className="text-xs text-muted-foreground">Joined December 2021</Text>
            </View>
          </View>
        </HoverCardContent>
      </HoverCard>
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger>Plain trigger</HoverCardTrigger>
        <HoverCardContent side="top">Text content</HoverCardContent>
      </HoverCard>
    </View>
  )
}
