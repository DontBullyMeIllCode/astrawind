import * as React from "react"
import { ScrollView, useTw, View } from "@astrawind/css"
import { cn } from "../lib/utils"

type ScrollAreaProps = Omit<React.ComponentProps<typeof ScrollView>, "horizontal"> & {
  /** Scroll direction. Defaults to horizontal when a `<ScrollBar orientation="horizontal" />` child is present. */
  orientation?: "vertical" | "horizontal"
}

/**
 * A scrollable region. `className` and `style` apply to the root box, as on the web;
 * other props go to the ScrollView that serves as the viewport. The platform's scroll
 * indicator stands in for the custom scrollbar.
 */
function ScrollArea({ className, style, children, orientation, ...props }: ScrollAreaProps) {
  const tw = useTw()
  const items = React.Children.toArray(children)
  const bars = items.filter((c) => React.isValidElement(c) && c.type === ScrollBar) as React.ReactElement<ScrollBarProps>[]
  const content = items.filter((c) => !(React.isValidElement(c) && c.type === ScrollBar))
  const horizontal =
    (orientation ?? (bars.some((b) => b.props.orientation === "horizontal") ? "horizontal" : "vertical")) === "horizontal"

  return (
    <View data-slot="scroll-area" className={cn("relative", className)} style={style}>
      <ScrollView
        data-slot="scroll-area-viewport"
        horizontal={horizontal}
        // `rounded-[inherit]`: the root's radius, resolved from its className.
        style={{ borderRadius: tw(cn("relative", className)).borderRadius as number | undefined }}
        className="size-full transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
        {...props}
      >
        {content}
      </ScrollView>
    </View>
  )
}

type ScrollBarProps = React.ComponentProps<typeof View> & {
  orientation?: "vertical" | "horizontal"
}

/**
 * Renders nothing: the native scroll indicator is used. Inside a ScrollArea,
 * `<ScrollBar orientation="horizontal" />` makes the area scroll horizontally.
 */
function ScrollBar(_props: ScrollBarProps): React.ReactElement | null {
  return null
}

export { ScrollArea, ScrollBar, type ScrollAreaProps, type ScrollBarProps }
