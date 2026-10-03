import * as React from "react"
import * as AspectRatioPrimitive from "@rn-primitives/aspect-ratio"
import { styled, type ClassNameProps } from "@astrawind/css"

const AspectRatioRoot = styled(AspectRatioPrimitive.Root) as unknown as React.ComponentType<
  AspectRatioPrimitive.RootProps & ClassNameProps
>

function AspectRatio({ ...props }: React.ComponentProps<typeof AspectRatioRoot>) {
  return <AspectRatioRoot data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }
