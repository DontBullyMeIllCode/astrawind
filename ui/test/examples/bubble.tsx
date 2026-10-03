import * as React from "react"
import { Text, View } from "@astrawind/css"
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@astrawind/ui/bubble"

const VARIANTS = ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"] as const

export default function BubbleExample() {
  return (
    <View className="w-full max-w-md gap-6">
      <BubbleGroup>
        {VARIANTS.map((variant) => (
          <Bubble key={variant} variant={variant} align={variant === "default" ? "end" : "start"}>
            <BubbleContent>This is a {variant} bubble.</BubbleContent>
          </Bubble>
        ))}
      </BubbleGroup>
      <BubbleGroup>
        <Bubble variant="muted">
          <BubbleContent onPress={() => {}}>Tap to retry sending</BubbleContent>
        </Bubble>
        <Bubble variant="secondary" className="mb-4">
          <BubbleContent>Sounds good to me!</BubbleContent>
          <BubbleReactions>
            <Text>👍</Text>
            <Text className="text-xs text-muted-foreground">2</Text>
          </BubbleReactions>
        </Bubble>
        <Bubble variant="outline" className="mt-4">
          <BubbleReactions side="top" align="start">
            <Text>🎉</Text>
          </BubbleReactions>
          <BubbleContent>We launched!</BubbleContent>
        </Bubble>
      </BubbleGroup>
    </View>
  )
}
