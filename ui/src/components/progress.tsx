import * as React from "react"
import * as ProgressPrimitive from "@rn-primitives/progress"
import { styled, type ClassNameProps } from "@astrawind/css"
import { cn } from "../lib/utils"

const ProgressRoot = styled(ProgressPrimitive.Root) as unknown as React.ComponentType<
  ProgressPrimitive.RootProps & ClassNameProps
>
const ProgressIndicator = styled(ProgressPrimitive.Indicator) as unknown as React.ComponentType<
  ProgressPrimitive.IndicatorProps & ClassNameProps
>

function Progress({ className, value, ...props }: React.ComponentProps<typeof ProgressRoot>) {
  return (
    <ProgressRoot
      data-slot="progress"
      value={value}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
      {...props}
    >
      <ProgressIndicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: [{ translateX: `-${100 - (value || 0)}%` as `${number}%` }] }}
      />
    </ProgressRoot>
  )
}

export { Progress }
