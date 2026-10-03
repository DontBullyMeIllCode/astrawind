import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Text, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { colorCompounds, neutralStyles, type Color } from "../lib/colors"
import { cn } from "../lib/utils"

type ViewProps = React.ComponentProps<typeof View>
type TextProps = React.ComponentProps<typeof Text>

// Web lays the alert out as a two-column grid (`grid grid-cols-[0_1fr]`, and
// `has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]` with an icon), with the text in
// `col-start-2`. Native: a flex row with the icon, then a column (`gap-y-0.5`) with the rest.
const alertVariants = cva(
  "relative flex w-full flex-row items-start rounded-lg border px-4 py-3 text-sm has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "bg-card text-destructive [&>svg]:text-current",
        // daisyUI's styles (not in shadcn): a tint of the color, and a dashed outline. Without a
        // `color`, in the foreground color.
        soft: neutralStyles.soft,
        dash: neutralStyles.dash,
      },
      /** The alert's color, as `destructive` colors it: the text and icon, and the border for `dash`. */
      color: {
        primary: "",
        info: "",
        success: "",
        warning: "",
        error: "",
      } satisfies Record<Color, string>,
    },
    compoundVariants: colorCompounds((c) => ({
      default: `${c.ghost} [&>svg]:text-current`,
      soft: `${c.soft} [&>svg]:text-current`,
      dash: `${c.dash} [&>svg]:text-current`,
    })),
    defaultVariants: {
      variant: "default",
    },
  }
)

// The text column holds the alert's other children, so it takes the `*:` class for them.
const alertContentVariants = cva("min-w-0 flex-1 flex-col gap-y-0.5", {
  variants: {
    variant: {
      default: "",
      destructive: "*:data-[slot=alert-description]:text-destructive/90",
      soft: "*:data-[slot=alert-description]:text-foreground/80",
      dash: "*:data-[slot=alert-description]:text-muted-foreground",
    },
    color: {
      primary: "",
      info: "",
      success: "",
      warning: "",
      error: "",
    } satisfies Record<Color, string>,
  },
  compoundVariants: colorCompounds((c) => ({
    default: `*:data-[slot=alert-description]:${c.muted}`,
    soft: `*:data-[slot=alert-description]:${c.muted}`,
    dash: `*:data-[slot=alert-description]:${c.muted}`,
  })),
  defaultVariants: {
    variant: "default",
  },
})

function isIcon(child: React.ReactNode) {
  return React.isValidElement(child) && child.type !== AlertTitle && child.type !== AlertDescription
}

function Alert({ className, variant, color, children, ...props }: ViewProps & VariantProps<typeof alertVariants>) {
  const items = React.Children.toArray(children)
  const first = items[0]
  const icon = isIcon(first) ? (first as React.ReactElement<{ className?: string }>) : undefined
  const rest = icon ? items.slice(1) : items
  return (
    <View
      data-slot="alert"
      data-variant={variant ?? "default"}
      data-color={color ?? undefined}
      role="alert"
      className={cn(alertVariants({ variant, color }), className)}
      {...props}
    >
      {/* `[&>svg]:translate-y-0.5`: icon defaults carry size and color only, so the icon gets it directly. */}
      {icon && React.cloneElement(icon, { className: cn(icon.props.className, "translate-y-0.5") })}
      <View className={cn(alertContentVariants({ variant, color }))}>{renderTextChildren(rest)}</View>
    </View>
  )
}

function AlertTitle({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="alert-title"
      className={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)}
      {...props}
    />
  )
}

// `[&_p]:leading-relaxed` is left out: there are no <p> elements to target.
function AlertDescription({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="alert-description"
      className={cn("col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground", className)}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

export { Alert, AlertTitle, AlertDescription }
