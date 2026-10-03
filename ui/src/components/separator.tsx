import * as React from "react"
import * as SeparatorPrimitive from "@rn-primitives/separator"
import { styled } from "@astrawind/css"
import { cn } from "../lib/utils"

const SeparatorRoot = styled(SeparatorPrimitive.Root)

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorRoot>) {
  // A vertical separator with its own height (`h-4`, `data-[orientation=vertical]:h-4`) is
  // aligned by its parent; stretching would pin it to the top.
  const sized = /(^|\s|:)(h|size)-/.test(className ?? "")
  return (
    <SeparatorRoot
      data-slot="separator"
      data-orientation={orientation}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        // `self-stretch` in place of `h-full`: a percentage height needs a sized parent on native.
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px",
        !sized && "data-[orientation=vertical]:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
