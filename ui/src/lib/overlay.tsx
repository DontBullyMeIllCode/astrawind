import * as React from "react"
import {
  Animated,
  Easing,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View as RNView,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { Pressable as StyledPressable, View } from "@astrawind/css"

export { useControllableState } from "./use-controllable-state"
export { textOf } from "./children"

/**
 * Shared helpers for overlay components (dialog, sheet, drawer, popover, menus,
 * select, combobox, command). Not part of the public API.
 */

export const USE_NATIVE_DRIVER = Platform.OS !== "web"

/**
 * Keeps an overlay mounted while its exit animation runs. `present` stays true
 * after `open` turns false until `onExited` is called.
 */
export function usePresence(open: boolean) {
  const [present, setPresent] = React.useState(open)
  if (open && !present) setPresent(true)
  const onExited = React.useCallback(() => setPresent(false), [])
  return { present: open || present, onExited }
}

export interface PresenceContextValue {
  open: boolean
  onExited: () => void
}

/**
 * Animates 0 → 1 when `open`, and 1 → 0 (then calls `onExited`) when closed.
 */
export function useOpenAnimation(open: boolean, onExited?: () => void, duration = 150) {
  const progress = React.useRef(new Animated.Value(0)).current
  const onExitedRef = React.useRef(onExited)
  onExitedRef.current = onExited
  React.useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    })
    anim.start(({ finished }) => {
      if (finished && !open) onExitedRef.current?.()
    })
    return () => anim.stop()
  }, [open, progress, duration])
  return progress
}

/** Fade + zoom (like `fade-in-0 zoom-in-95`) for popups. Enter animation only. */
export function PopupAnimation({
  children,
  style,
  scale = 0.95,
  pointerEvents,
}: {
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  scale?: number
  pointerEvents?: "box-none" | "none" | "box-only" | "auto"
}) {
  const progress = useOpenAnimation(true, undefined, 120)
  return (
    <Animated.View
      pointerEvents={pointerEvents}
      style={[
        {
          opacity: progress,
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [scale, 1] }) }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  )
}

/**
 * Makes a pressable report press and hover as focus, so the `focus:` highlight on
 * menu items (Radix's keyboard/pointer highlight) also shows
 * when an item is touched on native.
 */
export function withHighlight<P extends PressableProps>(Component: React.ComponentType<P>) {
  function Highlightable(props: P & { ref?: React.Ref<unknown> }) {
    const { onPressIn, onPressOut, onHoverIn, onHoverOut, onFocus, onBlur } = props as PressableProps
    return (
      <Component
        {...props}
        onPressIn={(e: GestureResponderEvent) => {
          onPressIn?.(e)
          onFocus?.(e as never)
        }}
        onPressOut={(e: GestureResponderEvent) => {
          onPressOut?.(e)
          onBlur?.(e as never)
        }}
        onHoverIn={(e: never) => {
          onHoverIn?.(e)
          onFocus?.(e)
        }}
        onHoverOut={(e: never) => {
          onHoverOut?.(e)
          onBlur?.(e)
        }}
      />
    )
  }
  Highlightable.displayName = `Highlightable(${Component.displayName ?? Component.name ?? "Component"})`
  return Highlightable as React.ComponentType<P>
}

type LongPressAdapterProps = PressableProps & {
  /** The user's own press handler (the primitive's toggle arrives as `onPress`). */
  __onPress?: PressableProps["onPress"]
  __asChild?: boolean
  className?: string
  children?: React.ReactNode
  ref?: React.Ref<unknown>
  [key: `data-${string}`]: unknown
}

/**
 * Used as the `asChild` child of a tooltip/hover-card trigger on native: the
 * primitive's open toggle runs on long-press, a normal press keeps the
 * trigger's own `onPress`.
 */
export function LongPressAdapter({ onPress, __onPress, __asChild, children, ref, ...rest }: LongPressAdapterProps) {
  if (__asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>
    return React.cloneElement(child, {
      ...rest,
      ...child.props,
      onPress: (child.props.onPress as PressableProps["onPress"]) ?? __onPress,
      onLongPress: onPress,
      ref,
    })
  }
  return (
    <StyledPressable ref={ref as React.Ref<never>} {...rest} onPress={__onPress} onLongPress={onPress}>
      {children}
    </StyledPressable>
  )
}

/** Merges refs (function or object). */
export function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node
    }
  }
}

type OpenableRef = { open: () => void; close: () => void } | null

/**
 * rn-primitives' popover/menu roots are uncontrolled. This syncs a controlled
 * `open` prop (and `defaultOpen`) through the trigger ref's open()/close().
 */
export function OpenSync({
  open,
  defaultOpen,
  isOpen,
  triggerRef,
}: {
  open?: boolean
  defaultOpen?: boolean
  isOpen: boolean
  triggerRef: React.RefObject<OpenableRef>
}) {
  const wanted = open ?? undefined
  React.useEffect(() => {
    if (!defaultOpen || open !== undefined) return
    const id = setTimeout(() => triggerRef.current?.open(), 0)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  React.useEffect(() => {
    if (wanted === undefined || wanted === isOpen) return
    const id = setTimeout(() => (wanted ? triggerRef.current?.open() : triggerRef.current?.close()), 0)
    return () => clearTimeout(id)
  }, [wanted, isOpen, triggerRef])
  return null
}

export type Side = "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end"
export type Align = "start" | "center" | "end"

/**
 * rn-primitives positions content above or below the trigger only on native; on web, Radix
 * places it on any side. Typed as the primitives' prop; on web it may be "left" or "right".
 */
export function verticalSide(side: Side | undefined, fallback: "top" | "bottom" = "bottom"): "top" | "bottom" {
  if (Platform.OS === "web" && side && side !== "top" && side !== "bottom") {
    // `inline-start`/`inline-end` follow the text direction, as in Radix.
    const rtl = !!I18nManager.getConstants?.().isRTL
    const physical = side === "inline-start" ? (rtl ? "right" : "left") : side === "inline-end" ? (rtl ? "left" : "right") : side
    return physical as "top" | "bottom"
  }
  return side === "top" || side === "bottom" ? side : fallback
}

/**
 * Full-screen layer shared by Dialog and AlertDialog: an animated backdrop and
 * a centered, keyboard-avoiding slot for the popup.
 */
export function CenteredOverlayLayout({
  progress,
  overlay,
  children,
}: {
  progress: Animated.Value
  overlay: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <RNView style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>{overlay}</Animated.View>
      <KeyboardAvoidingView
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 items-center justify-center p-4" style={{ pointerEvents: "box-none" }}>
          <Animated.View
            pointerEvents="box-none"
            // Stretch, and let the popup center itself (`mx-auto`): on web the dialog primitive wraps
            // it in a block element that `alignItems: center` would shrink to its content.
            style={{
              width: "100%",
              alignItems: "stretch",
              opacity: progress,
              transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
            }}
          >
            {children}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </RNView>
  )
}

