import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@rn-primitives/slot"
import { Pressable, styled, useAstraWind, useTw, View } from "@astrawind/css"
import { relativeOklch } from "../lib/bubble-colors"
import { renderTextChildren } from "../lib/children"
import { cn } from "../lib/utils"

type ViewProps = React.ComponentProps<typeof View>

const SlotPressable = styled(Slot.Pressable, { interactive: true })

function BubbleGroup({ className, ...props }: ViewProps) {
  return <View data-slot="bubble-group" className={cn("flex min-w-0 flex-col gap-2", className)} {...props} />
}

// `[&>[data-slot=bubble-content]:is(button,a):hover]:*` → `*:data-[slot=bubble-content]:hover:*` plus the
// matching `active:` class: only a pressable BubbleContent (`onPress` or `asChild`) has those states.
const bubbleVariants = cva(
  "group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full",
  {
    variants: {
      variant: {
        default:
          "*:data-[slot=bubble-content]:bg-primary *:data-[slot=bubble-content]:text-primary-foreground *:data-[slot=bubble-content]:hover:bg-primary/80 *:data-[slot=bubble-content]:active:bg-primary/80",
        secondary:
          "*:data-[slot=bubble-content]:bg-secondary *:data-[slot=bubble-content]:text-secondary-foreground *:data-[slot=bubble-content]:hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] *:data-[slot=bubble-content]:active:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        muted:
          "*:data-[slot=bubble-content]:bg-muted *:data-[slot=bubble-content]:hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)] *:data-[slot=bubble-content]:active:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]",
        // `oklch(from var(--primary) …)` backgrounds are computed from the theme's primary in `Bubble`.
        tinted: "*:data-[slot=bubble-content]:text-foreground",
        outline:
          "*:data-[slot=bubble-content]:border-border *:data-[slot=bubble-content]:bg-background *:data-[slot=bubble-content]:hover:bg-muted *:data-[slot=bubble-content]:active:bg-muted *:data-[slot=bubble-content]:hover:text-foreground *:data-[slot=bubble-content]:active:text-foreground dark:*:data-[slot=bubble-content]:hover:bg-input/30 dark:*:data-[slot=bubble-content]:active:bg-input/30",
        ghost:
          "border-none *:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0 *:data-[slot=bubble-content]:hover:bg-muted *:data-[slot=bubble-content]:active:bg-muted *:data-[slot=bubble-content]:hover:text-foreground *:data-[slot=bubble-content]:active:text-foreground dark:*:data-[slot=bubble-content]:hover:bg-muted/50 dark:*:data-[slot=bubble-content]:active:bg-muted/50",
        destructive:
          "*:data-[slot=bubble-content]:bg-destructive/10 *:data-[slot=bubble-content]:text-destructive dark:*:data-[slot=bubble-content]:bg-destructive/20 *:data-[slot=bubble-content]:hover:bg-destructive/20 *:data-[slot=bubble-content]:active:bg-destructive/20 dark:*:data-[slot=bubble-content]:hover:bg-destructive/30 dark:*:data-[slot=bubble-content]:active:bg-destructive/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Bubble({
  variant = "default",
  align = "start",
  className,
  ...props
}: ViewProps &
  VariantProps<typeof bubbleVariants> & {
    align?: "start" | "end"
  }) {
  const tw = useTw()
  const { colorScheme } = useAstraWind()
  let tinted: string | undefined
  if (variant === "tinted") {
    // web: bg-[oklch(from_var(--primary)_0.93_calc(c*0.4)_h)] (dark: 0.3), and on hover
    // bg-[oklch(from_var(--primary)_0.88_calc(c*0.5)_h)] (dark: 0.35).
    const primary = tw("bg-primary").backgroundColor as string | undefined
    const dark = colorScheme === "dark"
    const bg = relativeOklch(primary, dark ? 0.3 : 0.93, 0.4)
    const hover = relativeOklch(primary, dark ? 0.35 : 0.88, 0.5)
    tinted = cn(
      bg && `*:data-[slot=bubble-content]:bg-[${bg}]`,
      hover && `*:data-[slot=bubble-content]:hover:bg-[${hover}] *:data-[slot=bubble-content]:active:bg-[${hover}]`
    )
  }
  return (
    <View
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(bubbleVariants({ variant }), tinted, className)}
      {...props}
    />
  )
}

// `[button]:*` and `[button,a]:*` style the content when it's pressable.
const PRESSABLE_CONTENT =
  "text-left transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

type BubbleContentProps = Omit<React.ComponentProps<typeof Pressable>, "children"> & {
  asChild?: boolean
  children?: React.ReactNode
}

/**
 * A `View`, or a `Pressable` when it has `onPress`/`onLongPress` (web: `<button>`).
 * With `asChild`, the child is rendered in its place with the content's props.
 */
function BubbleContent({ asChild = false, className, children, onPress, onLongPress, ...props }: BubbleContentProps) {
  const pressable = asChild || !!onPress || !!onLongPress
  const classes = cn(
    "w-fit max-w-full min-w-0 overflow-hidden rounded-xl border border-transparent px-3 py-2 text-sm leading-relaxed wrap-break-word group-data-[align=end]/bubble:self-end",
    pressable && PRESSABLE_CONTENT,
    className
  )
  if (asChild) {
    return (
      <SlotPressable data-slot="bubble-content" className={classes} onPress={onPress} onLongPress={onLongPress} {...props}>
        {children}
      </SlotPressable>
    )
  }
  if (pressable) {
    return (
      <Pressable
        data-slot="bubble-content"
        role="button"
        className={classes}
        onPress={onPress}
        onLongPress={onLongPress}
        {...props}
      >
        {renderTextChildren(children)}
      </Pressable>
    )
  }
  return (
    <View data-slot="bubble-content" className={classes} {...(props as ViewProps)}>
      {renderTextChildren(children)}
    </View>
  )
}

/** Whether JSX children include a pressable (web: `has-[button]`). */
function hasButton(children: React.ReactNode): boolean {
  let found = false
  React.Children.forEach(children, (child) => {
    if (found || !React.isValidElement(child)) return
    const p = child.props as { onPress?: unknown; role?: unknown; children?: React.ReactNode }
    const name = (child.type as { displayName?: string; name?: string }).displayName ?? (child.type as { name?: string }).name
    found = !!p.onPress || p.role === "button" || name === "Button" || hasButton(p.children)
  })
  return found
}

const bubbleReactionsVariants = cva(
  "absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-sm ring-3 ring-card",
  {
    variants: {
      side: {
        top: "top-0 -translate-y-3/4",
        bottom: "bottom-0 translate-y-3/4",
      },
      align: {
        start: "left-3",
        end: "right-3",
      },
    },
    defaultVariants: {
      side: "bottom",
      align: "end",
    },
  }
)

function BubbleReactions({
  side = "bottom",
  align = "end",
  className,
  children,
  ...props
}: ViewProps & {
  align?: "start" | "end"
  side?: "top" | "bottom"
}) {
  return (
    <View
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      className={cn(bubbleReactionsVariants({ side, align }), hasButton(children) && "p-0", className)}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

export { BubbleGroup, Bubble, BubbleContent, BubbleReactions }
