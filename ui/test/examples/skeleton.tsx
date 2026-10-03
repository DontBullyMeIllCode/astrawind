import * as React from "react"
import { View } from "@astrawind/css"
import { Skeleton } from "@astrawind/ui/skeleton"

export default function SkeletonExample() {
  return (
    <View className="flex-row items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <View className="gap-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </View>
    </View>
  )
}
