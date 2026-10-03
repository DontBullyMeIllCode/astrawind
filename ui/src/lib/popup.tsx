import * as React from "react"
import { Animated, type StyleProp, type ViewStyle } from "react-native"
import { useOpenAnimation } from "./overlay"

/**
 * Enter animation for anchored popups (popover, hover card, tooltip): Radix's
 * `animate-in fade-in-0 zoom-in-95` plus `data-[side=bottom]:slide-in-from-top-2`
 * (and the other sides). The primitives unmount content as soon as they
 * close, so there is no exit animation.
 */
export function SidePopupAnimation({
  side = "bottom",
  distance = 8,
  children,
  style,
  pointerEvents,
}: {
  side?: "top" | "right" | "bottom" | "left"
  distance?: number
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  pointerEvents?: "box-none" | "none" | "box-only" | "auto"
}) {
  const progress = useOpenAnimation(true, undefined, 150)
  const from = side === "bottom" || side === "right" ? -distance : distance
  const slide = progress.interpolate({ inputRange: [0, 1], outputRange: [from, 0] })
  return (
    <Animated.View
      pointerEvents={pointerEvents}
      style={[
        {
          opacity: progress,
          transform: [
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
            side === "top" || side === "bottom" ? { translateY: slide } : { translateX: slide },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  )
}
