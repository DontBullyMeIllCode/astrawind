import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@rn-primitives/slot"
import { styled, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { cn } from "../lib/utils"
import { Input } from "./input"
import { Separator } from "./separator"

const SlotView = styled(Slot.View)

// The child selectors (`[&>*:not(:first-child)]:*`, `[&>*:not(:last-child)]:*`, `[&>input]:flex-1`)
// are applied to each direct child by position in `ButtonGroup` below. The `select` rules
// (`has-[select…]`, `[&>[data-slot=select-trigger]…]:w-fit`) and the focus-visible z-index
// (`[&>*]:focus-visible:relative [&>*]:focus-visible:z-10`) are left out: they target web-only
// markup and keyboard focus rings.
const buttonGroupVariants = cva("flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2", {
  variants: {
    orientation: {
      horizontal: "",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
})

function childClasses(orientation: "horizontal" | "vertical", first: boolean, last: boolean) {
  if (orientation === "vertical") return cn(!first && "rounded-t-none border-t-0", !last && "rounded-b-none")
  return cn(!first && "rounded-l-none border-l-0", !last && "rounded-r-none")
}

function ButtonGroup({
  className,
  orientation,
  children,
  ...props
}: React.ComponentProps<typeof View> & VariantProps<typeof buttonGroupVariants>) {
  const items = React.Children.toArray(children)
  const count = items.filter(React.isValidElement).length
  let index = 0
  const joined = items.map((child) => {
    if (!React.isValidElement<{ className?: string }>(child)) return child
    const i = index++
    return React.cloneElement(child, {
      className: cn(
        childClasses(orientation ?? "horizontal", i === 0, i === count - 1),
        child.type === Input && "flex-1",
        child.props.className
      ),
    })
  })

  return (
    <View
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    >
      {joined}
    </View>
  )
}

function ButtonGroupText({
  className,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<typeof View> & {
  asChild?: boolean
}) {
  const Comp = asChild ? SlotView : View

  return (
    <Comp
      className={cn(
        "flex items-center gap-2 rounded-md border bg-muted px-4 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {asChild ? children : renderTextChildren(children)}
    </Comp>
  )
}

function ButtonGroupSeparator({ className, orientation = "vertical", ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn("relative m-0! self-stretch bg-input data-[orientation=vertical]:h-auto", className)}
      {...props}
    />
  )
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants }
