import * as React from "react"
import { View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { cn } from "../lib/utils"

type ViewProps = React.ComponentProps<typeof View>

function Kbd({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none",
        "[&_svg:not([class*='size-'])]:size-3",
        // `[[data-slot=tooltip-content]_&]:*` → `in-data-[slot=tooltip-content]:*` (an ancestor's data-slot).
        "in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

function KbdGroup({ className, children, ...props }: ViewProps) {
  return (
    <View data-slot="kbd-group" className={cn("inline-flex items-center gap-1", className)} {...props}>
      {renderTextChildren(children)}
    </View>
  )
}

export { Kbd, KbdGroup }
