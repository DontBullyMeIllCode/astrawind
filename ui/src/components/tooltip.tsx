import * as React from "react"
import { Platform, StyleSheet } from "react-native"
import * as TooltipPrimitive from "@rn-primitives/tooltip"
import { styled, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { composeRefs, LongPressAdapter, OpenSync, verticalSide } from "../lib/overlay"
import { SidePopupAnimation } from "../lib/popup"
import { cn } from "../lib/utils"

const TooltipTriggerPrimitive = styled(TooltipPrimitive.Trigger, { interactive: true })

type ViewProps = React.ComponentProps<typeof View>

// The root renders a View; keep it out of the layout, like Radix's Root.
const ROOT_STYLE = { display: "contents" } as const
const INSETS = { top: 8, bottom: 8, left: 8, right: 8 }

type TooltipProviderProps = {
  /** Open delay on hover (web), in ms. Defaults to 0. Native tooltips open on long-press. */
  delayDuration?: number
  skipDelayDuration?: number
  disableHoverableContent?: boolean
  children?: React.ReactNode
}

const TooltipProviderContext = React.createContext<Omit<TooltipProviderProps, "children">>({})

function TooltipProvider({ delayDuration = 0, skipDelayDuration, disableHoverableContent, children }: TooltipProviderProps) {
  const value = React.useMemo(
    () => ({ delayDuration, skipDelayDuration, disableHoverableContent }),
    [delayDuration, skipDelayDuration, disableHoverableContent]
  )
  return <TooltipProviderContext.Provider value={value}>{children}</TooltipProviderContext.Provider>
}

const TooltipTriggerRefContext = React.createContext<React.RefObject<TooltipPrimitive.TriggerRef | null> | null>(null)

type TooltipProps = TooltipPrimitive.RootProps & {
  /** Controlled open state (synced through the trigger). */
  open?: boolean
  defaultOpen?: boolean
}

function Tooltip({
  open,
  defaultOpen,
  onOpenChange,
  delayDuration,
  skipDelayDuration,
  disableHoverableContent,
  children,
  ...props
}: TooltipProps) {
  const provider = React.useContext(TooltipProviderContext)
  const triggerRef = React.useRef<TooltipPrimitive.TriggerRef | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <TooltipPrimitive.Root
      data-slot="tooltip"
      style={ROOT_STYLE}
      delayDuration={delayDuration ?? provider.delayDuration}
      skipDelayDuration={skipDelayDuration ?? provider.skipDelayDuration}
      disableHoverableContent={disableHoverableContent ?? provider.disableHoverableContent}
      onOpenChange={(next) => {
        setIsOpen(next)
        onOpenChange?.(next)
      }}
      {...props}
    >
      <TooltipTriggerRefContext.Provider value={triggerRef}>{children}</TooltipTriggerRefContext.Provider>
      <OpenSync open={open} defaultOpen={defaultOpen} isOpen={isOpen} triggerRef={triggerRef} />
    </TooltipPrimitive.Root>
  )
}

type TooltipTriggerProps = Omit<React.ComponentProps<typeof TooltipTriggerPrimitive>, "children"> & {
  children?: React.ReactNode
  ref?: React.Ref<TooltipPrimitive.TriggerRef>
}

/** Opens on hover on the web and on long-press on native, where a normal press keeps `onPress`. */
function TooltipTrigger({ className, ref, asChild, onPress, children, ...props }: TooltipTriggerProps) {
  const triggerRef = React.useContext(TooltipTriggerRefContext)
  const composed = composeRefs(triggerRef ?? undefined, ref)
  const content = asChild ? children : renderTextChildren(children)
  if (Platform.OS === "web") {
    return (
      <TooltipTriggerPrimitive
        ref={composed as React.Ref<never>}
        data-slot="tooltip-trigger"
        className={className}
        asChild={asChild}
        onPress={onPress}
        {...props}
      >
        {content}
      </TooltipTriggerPrimitive>
    )
  }
  return (
    <TooltipPrimitive.Trigger ref={composed} asChild>
      <LongPressAdapter
        data-slot="tooltip-trigger"
        className={className}
        __asChild={asChild}
        __onPress={onPress ?? undefined}
        {...props}
      >
        {content}
      </LongPressAdapter>
    </TooltipPrimitive.Trigger>
  )
}

type TooltipContentProps = ViewProps & {
  /** On native `left` and `right` fall back to `top`: the primitive positions above or below the trigger. */
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  insets?: TooltipPrimitive.ContentProps["insets"]
}

function TooltipContent({
  className,
  side = "top",
  align = "center",
  sideOffset = 0,
  alignOffset = 0,
  avoidCollisions,
  insets = INSETS,
  children,
  ...props
}: TooltipContentProps) {
  const vside = verticalSide(side, "top")
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Overlay style={Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined}>
        <TooltipPrimitive.Content
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
              data-slot="tooltip-content"
              data-side={vside}
              data-align={align}
              data-state="delayed-open"
              // `origin-(--radix-tooltip-content-transform-origin)` is left out: the variable only exists on the web.
              className={cn(
                "z-50 w-fit rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background",
                className
              )}
              {...props}
            >
              {renderTextChildren(children)}
              {/* Radix's Arrow: a box on the content's edge (flipped for `bottom`) holding the rotated square. */}
              <View
                style={{ pointerEvents: "none" }}
                data-side={vside}
                className="absolute items-center justify-center data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-full data-[side=bottom]:rotate-180 data-[side=left]:inset-y-0 data-[side=left]:left-full data-[side=left]:-rotate-90 data-[side=right]:inset-y-0 data-[side=right]:right-full data-[side=right]:rotate-90 data-[side=top]:inset-x-0 data-[side=top]:top-full"
              >
                {/* `translate-y-[calc(-50%_-_2px)]`: half of `size-2.5`, plus 2px. */}
                <View className="z-50 size-2.5 translate-y-[-7px] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
              </View>
            </View>
          </SidePopupAnimation>
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Overlay>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
