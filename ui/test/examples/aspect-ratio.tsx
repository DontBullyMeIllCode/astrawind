import * as React from "react"
import { Image, View } from "@astrawind/css"
import { AspectRatio } from "@astrawind/ui/aspect-ratio"

export default function AspectRatioExample() {
  return (
    <View className="w-full max-w-sm">
      <AspectRatio ratio={16 / 9} className="rounded-lg bg-muted">
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80" }}
          accessibilityLabel="Photo by Drew Beamer"
          className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </AspectRatio>
    </View>
  )
}
