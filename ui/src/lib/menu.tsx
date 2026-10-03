import * as React from "react"
import { Animated, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native"
import { useInsets } from "./insets"
import { useOpenAnimation } from "./overlay"

/**
 * Shared helpers for the menu components (dropdown-menu, context-menu, menubar,
 * select, navigation-menu). Not part of the public API.
 */

/** rn-primitives roots render a View; Radix roots render nothing. */
export const ROOT_CONTENTS_STYLE = { display: "contents" } as const

export type MenuSide = "top" | "right" | "bottom" | "left"

export type CollisionPadding = number | Partial<Record<"top" | "right" | "bottom" | "left", number>>

/**
 * Radix's `collisionPadding` as rn-primitives `insets`, on top of the safe area
 * (Radix keeps popups inside the viewport; on a phone that's the safe area).
 */
export function useCollisionInsets(collisionPadding: CollisionPadding = 8) {
  const safe = useInsets()
  const pad = typeof collisionPadding === "number" ? { top: collisionPadding, right: collisionPadding, bottom: collisionPadding, left: collisionPadding } : collisionPadding
  return React.useMemo(
    () => ({
      top: safe.top + (pad.top ?? 0),
      bottom: safe.bottom + (pad.bottom ?? 0),
      left: safe.left + (pad.left ?? 0),
      right: safe.right + (pad.right ?? 0),
    }),
    [safe.top, safe.bottom, safe.left, safe.right, pad.top, pad.bottom, pad.left, pad.right]
  )
}

/**
 * `max-h-(--radix-*-content-available-height)`: the larger of the space above
 * and below the trigger, inside the insets.
 */
export function useAvailableHeight(
  trigger: { pageY: number; height: number } | null | undefined,
  sideOffset: number,
  insets: { top: number; bottom: number }
): number | undefined {
  const { height } = useWindowDimensions()
  if (!trigger) return undefined
  const below = height - (trigger.pageY + trigger.height) - sideOffset - insets.bottom
  const above = trigger.pageY - sideOffset - insets.top
  return Math.max(0, Math.round(Math.max(below, above)))
}

/**
 * Enter animation for menus: `animate-in fade-in-0 zoom-in-95` plus
 * `data-[side=*]:slide-in-from-*-2` (0.5rem toward the trigger's side).
 */
export function MenuPopupAnimation({
  side = "bottom",
  scale = 0.95,
  distance = 8,
  style,
  children,
}: {
  side?: MenuSide
  scale?: number
  distance?: number
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}) {
  const progress = useOpenAnimation(true, undefined, 150)
  const from = side === "bottom" || side === "right" ? -distance : distance
  const slide = progress.interpolate({ inputRange: [0, 1], outputRange: [from, 0] })
  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            side === "left" || side === "right" ? { translateX: slide } : { translateY: slide },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [scale, 1] }) },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  )
}

/**
 * Set inside a menu's content. Sub-menus render inline under their trigger on
 * native, so a `*Portal` around a `*SubContent` must not open a second portal.
 */
export const InsideMenuContentContext = React.createContext(false)
