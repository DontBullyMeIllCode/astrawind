import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@rn-primitives/slot"
import { styled, Text, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { cn } from "../lib/utils"

const SlotView = styled(Slot.View)

type ViewProps = React.ComponentProps<typeof View>

// `[a]:*` (a marker rendered as a link) is left out: the link it's rendered as with
// `asChild` styles itself. The separator variant's `before:`/`after:` rules are real Views.
const markerVariants = cva(
  "group/marker relative flex min-h-4 w-full items-center gap-2 text-left text-sm text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "",
        separator: "",
        border: "border-b border-border pb-2",
      },
    },
  }
)

function MarkerRule({ className }: { className: string }) {
  return <View aria-hidden data-slot="marker-rule" className={cn("h-px min-w-0 flex-1 bg-border", className)} />
}

function Marker({
  className,
  variant = "default",
  asChild = false,
  children,
  ...props
}: ViewProps &
  VariantProps<typeof markerVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? SlotView : View
  const separator = variant === "separator" && !asChild

  return (
    <Comp
      data-slot="marker"
      data-variant={variant}
      className={cn(markerVariants({ variant, className }))}
      {...props}
    >
      {separator && <MarkerRule className="mr-1" />}
      {asChild ? children : renderTextChildren(children)}
      {separator && <MarkerRule className="ml-1" />}
    </Comp>
  )
}

function MarkerIcon({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="marker-icon"
      aria-hidden
      className={cn("size-4 shrink-0 [&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    />
  )
}

// `*:[a]:*` is left out: links inside are nested <Text>s that style themselves.
// `shrink`: flex items shrink by default on the web, not on native.
function MarkerContent({ className, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text
      data-slot="marker-content"
      className={cn(
        "min-w-0 shrink wrap-break-word group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center",
        className
      )}
      {...props}
    />
  )
}

export { Marker, MarkerIcon, MarkerContent, markerVariants }
