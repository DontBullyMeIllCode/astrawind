import * as React from "react"
import { View } from "@astrawind/css"
import { Badge } from "@astrawind/ui/badge"
import { Button } from "@astrawind/ui/button"
import { Spinner } from "@astrawind/ui/spinner"

export default function SpinnerExample() {
  return (
    <View className="w-full max-w-xs items-center gap-4">
      <View className="flex-row items-center gap-6">
        <Spinner />
        <Spinner className="size-6" />
        <Spinner className="size-8 text-primary" />
      </View>
      <Button disabled size="sm">
        <Spinner />
        Loading...
      </Button>
      <Badge variant="secondary">
        <Spinner />
        Syncing
      </Badge>
    </View>
  )
}
