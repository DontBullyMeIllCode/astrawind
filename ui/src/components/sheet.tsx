import * as React from "react"
import { Animated, StyleSheet, useWindowDimensions, View as RNView } from "react-native"
import * as SheetPrimitive from "@rn-primitives/dialog"
import { XIcon } from "lucide-react-native"
import { styled, View, type ClassNameProps } from "@astrawind/css"
import { Icon } from "./icon"
import { renderTextChildren } from "../lib/children"
import { useInsets } from "../lib/insets"
import { useKeyboardHeight } from "../lib/keyboard"
import { useControllableState, useOpenAnimation, usePresence, type PresenceContextValue } from "../lib/overlay"
import { cn } from "../lib/utils"

const SheetTriggerPrimitive = styled(SheetPrimitive.Trigger, { interactive: true })
const SheetClosePrimitive = styled(SheetPrimitive.Close, { interactive: true })
const SheetOverlayPrimitive = styled(SheetPrimitive.Overlay) as unknown as React.ComponentType<
  SheetPrimitive.OverlayProps & ClassNameProps
>
const SheetContentPrimitive = styled(SheetPrimitive.Content) as unknown as React.ComponentType<
  SheetPrimitive.ContentProps & ClassNameProps
>
const SheetTitlePrimitive = styled(SheetPrimitive.Title, { kind: "text" })
const SheetDescriptionPrimitive = styled(SheetPrimitive.Description, { kind: "text" })

type ViewProps = React.ComponentProps<typeof View>

// The root renders a View; keep it out of the layout, like Radix's Root.
const ROOT_STYLE = { display: "contents" } as const

const SheetPresenceContext = React.createContext<PresenceContextValue>({ open: true, onExited: () => {} })

type SheetProps = Omit<SheetPrimitive.RootProps, "open" | "defaultOpen" | "onOpenChange"> & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function Sheet({ open: openProp, defaultOpen = false, onOpenChange, ...props }: SheetProps) {
  const [open, setOpen] = useControllableState({ prop: openProp, defaultProp: defaultOpen, onChange: onOpenChange })
  // The primitive stays open while the exit animation runs.
  const { present, onExited } = usePresence(open)
  const presence = React.useMemo(() => ({ open, onExited }), [open, onExited])
  return (
    <SheetPresenceContext.Provider value={presence}>
      <SheetPrimitive.Root data-slot="sheet" style={ROOT_STYLE} open={present} onOpenChange={setOpen} {...props} />
    </SheetPresenceContext.Provider>
  )
}

function SheetTrigger(props: React.ComponentProps<typeof SheetTriggerPrimitive>) {
  return <SheetTriggerPrimitive data-slot="sheet-trigger" {...props} />
}

function SheetClose(props: React.ComponentProps<typeof SheetClosePrimitive>) {
  return <SheetClosePrimitive data-slot="sheet-close" {...props} />
}

function SheetPortal(props: SheetPrimitive.PortalProps) {
  return <SheetPrimitive.Portal {...props} />
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetOverlayPrimitive>) {
  const { open } = React.useContext(SheetPresenceContext)
  return (
    <SheetOverlayPrimitive
      data-slot="sheet-overlay"
      data-state={open ? "open" : "closed"}
      // The fade runs in SheetContent (`animate-in fade-in-0` / `animate-out fade-out-0`).
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      {...props}
    />
  )
}

type SheetSide = "top" | "right" | "bottom" | "left"

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  style,
  ...props
}: React.ComponentProps<typeof SheetContentPrimitive> & {
  side?: SheetSide
  showCloseButton?: boolean
}) {
  const presence = React.useContext(SheetPresenceContext)
  // `data-[state=open]:duration-500` / `data-[state=closed]:duration-300`.
  const progress = useOpenAnimation(presence.open, presence.onExited, presence.open ? 500 : 300)
  const { width, height } = useWindowDimensions()
  // `slide-in-from-<side>` / `slide-out-to-<side>`.
  const offset = side === "left" ? -width : side === "right" ? width : side === "top" ? -height : height
  const translate = progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] })
  const transform = side === "left" || side === "right" ? [{ translateX: translate }] : [{ translateY: translate }]
  // Keep content clear of the status bar and home indicator on the edges the sheet touches,
  // and a bottom sheet above the keyboard.
  const insets = useInsets()
  const keyboard = useKeyboardHeight(side === "bottom")
  const safeArea = {
    paddingTop: side === "bottom" ? 0 : insets.top,
    paddingBottom: side === "top" ? 0 : insets.bottom,
  }

  return (
    <SheetPortal>
      <RNView style={[StyleSheet.absoluteFill, { pointerEvents: "box-none" }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
          <SheetOverlay />
        </Animated.View>
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform, pointerEvents: "box-none" }, keyboard ? { bottom: keyboard } : undefined]}
        >
          <SheetContentPrimitive
            data-slot="sheet-content"
            data-side={side}
            data-state={presence.open ? "open" : "closed"}
            className={cn(
              "fixed z-50 flex flex-col gap-4 bg-background shadow-lg",
              side === "right" && "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
              side === "left" && "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
              side === "top" && "inset-x-0 top-0 h-auto border-b",
              side === "bottom" && "inset-x-0 bottom-0 h-auto border-t",
              className
            )}
            style={[safeArea, style]}
            {...props}
          >
            {renderTextChildren(children)}
            {showCloseButton && (
              <SheetClosePrimitive
                aria-label="Close"
                className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden active:opacity-100 disabled:pointer-events-none data-[state=open]:bg-secondary"
                // `top-4` is measured from the border box: add the safe-area padding.
                style={safeArea.paddingTop ? { top: 16 + safeArea.paddingTop } : undefined}
              >
                <Icon as={XIcon} className="size-4" />
              </SheetClosePrimitive>
            )}
          </SheetContentPrimitive>
        </Animated.View>
      </RNView>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: ViewProps) {
  return <View data-slot="sheet-header" className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />
}

function SheetFooter({ className, ...props }: ViewProps) {
  return <View data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetTitlePrimitive>) {
  return <SheetTitlePrimitive data-slot="sheet-title" className={cn("font-semibold text-foreground", className)} {...props} />
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetDescriptionPrimitive>) {
  return (
    <SheetDescriptionPrimitive
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  type SheetProps,
}
