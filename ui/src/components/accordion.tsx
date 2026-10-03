import * as React from "react"
import { Animated, Easing, type LayoutChangeEvent } from "react-native"
import * as AccordionPrimitive from "@rn-primitives/accordion"
import { ChevronDownIcon } from "lucide-react-native"
import { styled, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { usePosition, withPositions } from "../lib/position"
import { cn } from "../lib/utils"
import { Icon } from "./icon"

const AccordionRoot = styled(AccordionPrimitive.Root)
const AccordionItemRoot = styled(AccordionPrimitive.Item)
const AccordionHeader = styled(AccordionPrimitive.Header)
const AccordionTriggerRoot = styled(AccordionPrimitive.Trigger, { interactive: true })
const AccordionContentRoot = styled(AccordionPrimitive.Content)

type AccordionBaseProps = Omit<
  React.ComponentProps<typeof AccordionRoot>,
  "type" | "value" | "defaultValue" | "onValueChange" | "children"
> & { children?: React.ReactNode }

type AccordionSingleProps = {
  type: "single"
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  collapsible?: boolean
}

type AccordionMultipleProps = {
  type: "multiple"
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

type AccordionProps = AccordionBaseProps & (AccordionSingleProps | AccordionMultipleProps)

function Accordion({ children, ...props }: AccordionProps) {
  const rootProps =
    props.type === "single"
      ? {
          ...props,
          // Radix reports "" when a single accordion collapses.
          onValueChange: (v: string | undefined) => props.onValueChange?.(v ?? ""),
        }
      : props
  return (
    <AccordionRoot data-slot="accordion" data-orientation={props.orientation ?? "vertical"} {...(rootProps as AccordionPrimitive.RootProps)}>
      {withPositions(children, "accordion")}
    </AccordionRoot>
  )
}

function AccordionItem({ className, disabled, ...props }: React.ComponentProps<typeof AccordionItemRoot>) {
  const root = AccordionPrimitive.useRootContext()
  const pos = usePosition("accordion")
  const open = Array.isArray(root.value) ? root.value.includes(props.value) : root.value === props.value
  return (
    <AccordionItemRoot
      data-slot="accordion-item"
      data-state={open ? "open" : "closed"}
      data-disabled={disabled || root.disabled ? "" : undefined}
      disabled={disabled}
      // `last:border-b-0` from the item's position in the accordion.
      className={cn("border-b", (pos?.last ?? false) && "border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof AccordionTriggerRoot>, "children"> & { children?: React.ReactNode }) {
  const { isExpanded, disabled } = AccordionPrimitive.useItemContext()
  const state = isExpanded ? "open" : "closed"
  return (
    <AccordionHeader className="flex">
      <AccordionTriggerRoot
        data-slot="accordion-trigger"
        data-state={state}
        data-disabled={disabled ? "" : undefined}
        aria-expanded={isExpanded}
        className={cn(
          "flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {renderTextChildren(children, "shrink")}
        {/* `[&[data-state=open]>svg]:rotate-180` on the icon itself. */}
        <Icon
          as={ChevronDownIcon}
          data-state={state}
          className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180"
        />
      </AccordionTriggerRoot>
    </AccordionHeader>
  )
}

/**
 * `data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down`
 * animate the content's height to and from its measured height here.
 */
function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionContentRoot>) {
  const { isExpanded } = AccordionPrimitive.useItemContext()
  const [mounted, setMounted] = React.useState(isExpanded)
  const [animating, setAnimating] = React.useState(false)
  const [height, setHeight] = React.useState(0)
  const progress = React.useRef(new Animated.Value(isExpanded ? 1 : 0)).current
  const first = React.useRef(true)

  if (isExpanded && !mounted) setMounted(true)

  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setAnimating(true)
    const anim = Animated.timing(progress, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    })
    anim.start(({ finished }) => {
      if (!finished) return
      setAnimating(false)
      if (!isExpanded) setMounted(false)
    })
    return () => anim.stop()
  }, [isExpanded, progress])

  if (!mounted) return null

  return (
    <AccordionContentRoot
      forceMount
      data-slot="accordion-content"
      data-state={isExpanded ? "open" : "closed"}
      aria-hidden={!isExpanded}
      className="overflow-hidden text-sm"
      {...props}
    >
      <Animated.View
        style={
          animating
            ? { overflow: "hidden", height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }
            : undefined
        }
      >
        <View
          onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}
          className={cn("pt-0 pb-4", className)}
        >
          {renderTextChildren(children)}
        </View>
      </Animated.View>
    </AccordionContentRoot>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, type AccordionProps }
