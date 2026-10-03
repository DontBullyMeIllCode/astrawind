import * as React from "react"
import { Animated, PanResponder, StyleSheet, useWindowDimensions, View as RNView } from "react-native"
import * as DrawerPrimitive from "@rn-primitives/dialog"
import { styled, View, type ClassNameProps } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { useInsets } from "../lib/insets"
import { useKeyboardHeight } from "../lib/keyboard"
import { USE_NATIVE_DRIVER, useControllableState, useOpenAnimation, usePresence } from "../lib/overlay"
import { cn } from "../lib/utils"

/**
 * vaul has no React Native build: this is a sheet on the dialog primitive that
 * slides in from `direction` and closes when swiped back towards it.
 */

const DrawerTriggerPrimitive = styled(DrawerPrimitive.Trigger, { interactive: true })
const DrawerClosePrimitive = styled(DrawerPrimitive.Close, { interactive: true })
const DrawerOverlayPrimitive = styled(DrawerPrimitive.Overlay) as unknown as React.ComponentType<
  DrawerPrimitive.OverlayProps & ClassNameProps
>
const DrawerContentPrimitive = styled(DrawerPrimitive.Content) as unknown as React.ComponentType<
  DrawerPrimitive.ContentProps & ClassNameProps
>
const DrawerTitlePrimitive = styled(DrawerPrimitive.Title, { kind: "text" })
const DrawerDescriptionPrimitive = styled(DrawerPrimitive.Description, { kind: "text" })

type ViewProps = React.ComponentProps<typeof View>
type DrawerDirection = "top" | "right" | "bottom" | "left"

// The root renders a View; keep it out of the layout, like vaul's Root.
const ROOT_STYLE = { display: "contents" } as const

interface DrawerContextValue {
  open: boolean
  onExited: () => void
  direction: DrawerDirection
  dismissible: boolean
  modal: boolean
}

const DrawerContext = React.createContext<DrawerContextValue>({
  open: true,
  onExited: () => {},
  direction: "bottom",
  dismissible: true,
  modal: true,
})

type DrawerProps = Omit<DrawerPrimitive.RootProps, "open" | "defaultOpen" | "onOpenChange"> & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The edge the drawer comes from. Defaults to "bottom". */
  direction?: DrawerDirection
  /** When false, swiping and pressing the overlay don't close it. Defaults to true. */
  dismissible?: boolean
  /** When false, no overlay is rendered. Defaults to true. */
  modal?: boolean
}

function Drawer({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  direction = "bottom",
  dismissible = true,
  modal = true,
  ...props
}: DrawerProps) {
  const [open, setOpen] = useControllableState({ prop: openProp, defaultProp: defaultOpen, onChange: onOpenChange })
  // The primitive stays open while the exit animation runs.
  const { present, onExited } = usePresence(open)
  const value = React.useMemo(
    () => ({ open, onExited, direction, dismissible, modal }),
    [open, onExited, direction, dismissible, modal]
  )
  return (
    <DrawerContext.Provider value={value}>
      <DrawerPrimitive.Root data-slot="drawer" style={ROOT_STYLE} open={present} onOpenChange={setOpen} {...props} />
    </DrawerContext.Provider>
  )
}

function DrawerTrigger(props: React.ComponentProps<typeof DrawerTriggerPrimitive>) {
  return <DrawerTriggerPrimitive data-slot="drawer-trigger" {...props} />
}

function DrawerPortal(props: DrawerPrimitive.PortalProps) {
  return <DrawerPrimitive.Portal {...props} />
}

function DrawerClose(props: React.ComponentProps<typeof DrawerClosePrimitive>) {
  return <DrawerClosePrimitive data-slot="drawer-close" {...props} />
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerOverlayPrimitive>) {
  const { open, dismissible } = React.useContext(DrawerContext)
  return (
    <DrawerOverlayPrimitive
      data-slot="drawer-overlay"
      data-state={open ? "open" : "closed"}
      closeOnPress={dismissible}
      // The fade runs in DrawerContent (`animate-in fade-in-0` / `animate-out fade-out-0`).
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      {...props}
    />
  )
}

function DrawerContent({ className, children, style, ...props }: React.ComponentProps<typeof DrawerContentPrimitive>) {
  const { open, onExited, direction, dismissible, modal } = React.useContext(DrawerContext)
  const { onOpenChange } = DrawerPrimitive.useRootContext()
  const { width, height } = useWindowDimensions()
  const insets = useInsets()
  const keyboard = useKeyboardHeight(direction === "bottom")
  const vertical = direction === "top" || direction === "bottom"
  // +1 when closing moves the drawer towards +x/+y.
  const sign = direction === "bottom" || direction === "right" ? 1 : -1
  const distance = vertical ? height : width

  const progress = useOpenAnimation(open, onExited, 500)
  // How far the drawer has been dragged towards its edge, in px.
  const drag = React.useRef(new Animated.Value(0)).current
  const size = React.useRef(0)

  const offset = Animated.multiply(
    Animated.add(progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }), drag),
    sign
  )
  const transform = vertical ? [{ translateY: offset }] : [{ translateX: offset }]
  const overlayOpacity = Animated.multiply(
    progress,
    drag.interpolate({ inputRange: [0, Math.max(1, distance / 2)], outputRange: [1, 0], extrapolate: "clamp" })
  )

  const onOpenChangeRef = React.useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => {
          if (!dismissible) return false
          const main = vertical ? g.dy : g.dx
          const cross = vertical ? g.dx : g.dy
          return main * sign > 6 && Math.abs(main) > Math.abs(cross) * 1.5
        },
        onPanResponderMove: (_e, g) => {
          const d = (vertical ? g.dy : g.dx) * sign
          // Rubber-band when dragged away from the edge.
          drag.setValue(d >= 0 ? d : -Math.min(24, Math.sqrt(-d) * 2))
        },
        onPanResponderRelease: (_e, g) => {
          const d = (vertical ? g.dy : g.dx) * sign
          const v = (vertical ? g.vy : g.vx) * sign
          const threshold = (size.current || distance / 2) * 0.35
          if (d > threshold || v > 0.8) {
            Animated.timing(drag, {
              toValue: size.current || distance,
              duration: 180,
              useNativeDriver: USE_NATIVE_DRIVER,
            }).start(() => onOpenChangeRef.current(false))
          } else {
            Animated.spring(drag, { toValue: 0, bounciness: 4, useNativeDriver: USE_NATIVE_DRIVER }).start()
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(drag, { toValue: 0, useNativeDriver: USE_NATIVE_DRIVER }).start()
        },
      }),
    [vertical, sign, distance, drag, dismissible]
  )

  // Reset the drag once the drawer has closed, for the next open.
  React.useEffect(() => {
    if (open) drag.setValue(0)
  }, [open, drag])

  // Pad the edges that meet the screen so content clears the status bar and home indicator.
  const safeArea = {
    paddingTop: direction === "bottom" ? 0 : insets.top,
    paddingBottom: direction === "top" ? 0 : insets.bottom,
  }

  return (
    <DrawerPortal>
      <RNView style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {modal && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}>
            <DrawerOverlay />
          </Animated.View>
        )}
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform }, keyboard ? { bottom: keyboard } : undefined]}
          pointerEvents="box-none"
        >
          <DrawerContentPrimitive
            data-slot="drawer-content"
            data-state={open ? "open" : "closed"}
            data-vaul-drawer-direction={direction}
            className={cn(
              "group/drawer-content fixed z-50 flex h-auto flex-col bg-background",
              "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
              "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
              "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
              "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
              className
            )}
            style={[safeArea, style]}
            onLayout={(e) => {
              size.current = vertical ? e.nativeEvent.layout.height : e.nativeEvent.layout.width
            }}
            {...panResponder.panHandlers}
            {...props}
          >
            <View
              aria-hidden
              className="mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block"
            />
            {renderTextChildren(children)}
          </DrawerContentPrimitive>
        </Animated.View>
      </RNView>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: ViewProps) {
  return <View data-slot="drawer-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerTitlePrimitive>) {
  return <DrawerTitlePrimitive data-slot="drawer-title" className={cn("font-semibold text-foreground", className)} {...props} />
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerDescriptionPrimitive>) {
  return (
    <DrawerDescriptionPrimitive
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  type DrawerProps,
}
