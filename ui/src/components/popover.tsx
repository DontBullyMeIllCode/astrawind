import * as React from "react"
import { Platform, StyleSheet } from "react-native"
import * as PopoverPrimitive from "@rn-primitives/popover"
import { styled, Text, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { composeRefs, OpenSync, verticalSide } from "../lib/overlay"
import { SidePopupAnimation } from "../lib/popup"
import { cn } from "../lib/utils"

const PopoverTriggerPrimitive = styled(PopoverPrimitive.Trigger, { interactive: true })

type ViewProps = React.ComponentProps<typeof View>
type TextProps = React.ComponentProps<typeof Text>

// The root renders a View; keep it out of the layout, like Radix's Root.
const ROOT_STYLE = { display: "contents" } as const
const INSETS = { top: 12, bottom: 12, left: 12, right: 12 }

const PopoverTriggerRefContext = React.createContext<React.RefObject<PopoverPrimitive.TriggerRef | null> | null>(null)

type PopoverProps = PopoverPrimitive.RootProps & {
  /** Controlled open state (synced through the trigger). */
  open?: boolean
  defaultOpen?: boolean
}

function Popover({ open, defaultOpen, onOpenChange, children, ...props }: PopoverProps) {
  const triggerRef = React.useRef<PopoverPrimitive.TriggerRef | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <PopoverPrimitive.Root
      data-slot="popover"
      style={ROOT_STYLE}
      onOpenChange={(next) => {
        setIsOpen(next)
        onOpenChange?.(next)
      }}
      {...props}
    >
      <PopoverTriggerRefContext.Provider value={triggerRef}>{children}</PopoverTriggerRefContext.Provider>
      <OpenSync open={open} defaultOpen={defaultOpen} isOpen={isOpen} triggerRef={triggerRef} />
    </PopoverPrimitive.Root>
  )
}

function PopoverTrigger({
  ref,
  ...props
}: React.ComponentProps<typeof PopoverTriggerPrimitive> & { ref?: React.Ref<PopoverPrimitive.TriggerRef> }) {
  const triggerRef = React.useContext(PopoverTriggerRefContext)
  return (
    <PopoverTriggerPrimitive
      ref={composeRefs(triggerRef ?? undefined, ref) as React.Ref<never>}
      data-slot="popover-trigger"
      {...props}
    />
  )
}

type PopoverContentProps = ViewProps & {
  /** `left` and `right` fall back to `bottom`: the primitive positions above or below the trigger. */
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  insets?: PopoverPrimitive.ContentProps["insets"]
}

function PopoverContent({
  className,
  side = "bottom",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  avoidCollisions,
  insets = INSETS,
  children,
  ...props
}: PopoverContentProps) {
  const vside = verticalSide(side)
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Overlay style={Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined}>
        <PopoverPrimitive.Content
          side={vside}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          insets={insets}
        >
          {/* `animate-in fade-in-0 zoom-in-95 data-[side=*]:slide-in-from-*-2` */}
          <SidePopupAnimation side={vside}>
            <View
              data-slot="popover-content"
              data-side={vside}
              data-align={align}
              data-state="open"
              // `origin-(--radix-popover-content-transform-origin)` is left out: the variable only exists on the web.
              className={cn(
                "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden",
                className
              )}
              {...props}
            >
              {renderTextChildren(children)}
            </View>
          </SidePopupAnimation>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Overlay>
    </PopoverPrimitive.Portal>
  )
}

/** The primitive positions content against the trigger; the anchor only renders its children. */
function PopoverAnchor(props: ViewProps) {
  return <View data-slot="popover-anchor" {...props} />
}

function PopoverHeader({ className, ...props }: ViewProps) {
  return <View data-slot="popover-header" className={cn("flex flex-col gap-1 text-sm", className)} {...props} />
}

function PopoverTitle({ className, ...props }: TextProps) {
  return <Text data-slot="popover-title" className={cn("font-medium", className)} {...props} />
}

function PopoverDescription({ className, ...props }: TextProps) {
  return <Text data-slot="popover-description" className={cn("text-muted-foreground", className)} {...props} />
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  type PopoverProps,
}
