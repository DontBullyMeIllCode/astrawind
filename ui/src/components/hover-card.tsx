import * as React from "react"
import { Platform, StyleSheet } from "react-native"
import * as HoverCardPrimitive from "@rn-primitives/hover-card"
import { styled, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { composeRefs, LongPressAdapter, OpenSync, verticalSide } from "../lib/overlay"
import { SidePopupAnimation } from "../lib/popup"
import { cn } from "../lib/utils"

const HoverCardTriggerPrimitive = styled(HoverCardPrimitive.Trigger, { interactive: true })

type ViewProps = React.ComponentProps<typeof View>

// The root renders a View; keep it out of the layout, like Radix's Root.
const ROOT_STYLE = { display: "contents" } as const
const INSETS = { top: 12, bottom: 12, left: 12, right: 12 }

const HoverCardTriggerRefContext = React.createContext<React.RefObject<HoverCardPrimitive.TriggerRef | null> | null>(
  null
)

type HoverCardProps = HoverCardPrimitive.RootProps & {
  /** Controlled open state (synced through the trigger). */
  open?: boolean
  defaultOpen?: boolean
}

function HoverCard({ open, defaultOpen, onOpenChange, children, ...props }: HoverCardProps) {
  const triggerRef = React.useRef<HoverCardPrimitive.TriggerRef | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <HoverCardPrimitive.Root
      data-slot="hover-card"
      style={ROOT_STYLE}
      onOpenChange={(next) => {
        setIsOpen(next)
        onOpenChange?.(next)
      }}
      {...props}
    >
      <HoverCardTriggerRefContext.Provider value={triggerRef}>{children}</HoverCardTriggerRefContext.Provider>
      <OpenSync open={open} defaultOpen={defaultOpen} isOpen={isOpen} triggerRef={triggerRef} />
    </HoverCardPrimitive.Root>
  )
}

type HoverCardTriggerProps = Omit<React.ComponentProps<typeof HoverCardTriggerPrimitive>, "children"> & {
  children?: React.ReactNode
  ref?: React.Ref<HoverCardPrimitive.TriggerRef>
}

/** Opens on hover on the web and on long-press on native, where a normal press keeps `onPress`. */
function HoverCardTrigger({ className, ref, asChild, onPress, children, ...props }: HoverCardTriggerProps) {
  const triggerRef = React.useContext(HoverCardTriggerRefContext)
  const composed = composeRefs(triggerRef ?? undefined, ref)
  const content = asChild ? children : renderTextChildren(children)
  if (Platform.OS === "web") {
    return (
      <HoverCardTriggerPrimitive
        ref={composed as React.Ref<never>}
        data-slot="hover-card-trigger"
        className={className}
        asChild={asChild}
        onPress={onPress}
        {...props}
      >
        {content}
      </HoverCardTriggerPrimitive>
    )
  }
  return (
    <HoverCardPrimitive.Trigger ref={composed} asChild>
      <LongPressAdapter
        data-slot="hover-card-trigger"
        className={className}
        __asChild={asChild}
        __onPress={onPress ?? undefined}
        {...props}
      >
        {content}
      </LongPressAdapter>
    </HoverCardPrimitive.Trigger>
  )
}

type HoverCardContentProps = ViewProps & {
  /** `left` and `right` fall back to `bottom`: the primitive positions above or below the trigger. */
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  insets?: HoverCardPrimitive.ContentProps["insets"]
}

function HoverCardContent({
  className,
  side = "bottom",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  avoidCollisions,
  insets = INSETS,
  children,
  ...props
}: HoverCardContentProps) {
  const vside = verticalSide(side)
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Overlay style={Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined}>
        <HoverCardPrimitive.Content
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
              data-slot="hover-card-content"
              data-side={vside}
              data-align={align}
              data-state="open"
              // `origin-(--radix-hover-card-content-transform-origin)` is left out: the variable only exists on the web.
              className={cn(
                "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden",
                className
              )}
              {...props}
            >
              {renderTextChildren(children)}
            </View>
          </SidePopupAnimation>
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Overlay>
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent, type HoverCardProps }
