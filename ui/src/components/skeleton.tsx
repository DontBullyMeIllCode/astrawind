import * as React from "react"
import { View } from "@astrawind/css"
import { cn } from "../lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View data-slot="skeleton" className={cn("animate-pulse rounded-md bg-accent", className)} {...props} />
}

export { Skeleton }
