import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@rn-primitives/slot"
import { styled, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { colorCompounds, neutralStyles, type Color } from "../lib/colors"
import { cn } from "../lib/utils"

const SlotView = styled(Slot.View)

// `[a&]:hover:*` (a badge rendered as a link) is left out: the link it's rendered as
// with `asChild` handles its own press styles.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline: "border-border text-foreground",
        ghost: "",
        link: "text-primary underline-offset-4",
        // daisyUI's styles (not in shadcn): a tint of the color, and a dashed outline. Without a
        // `color`, in the foreground color.
        soft: neutralStyles.soft,
        dash: neutralStyles.dash,
      },
      /**
       * The color of the `default`, `outline`, `ghost`, `link`, `soft` and `dash` styles
       * (shadcn's `secondary` and `destructive` are colors of their own).
       */
      color: {
        primary: "",
        info: "",
        success: "",
        warning: "",
        error: "",
      } satisfies Record<Color, string>,
    },
    compoundVariants: colorCompounds((c) => ({
      default: c.solid,
      outline: c.outline,
      ghost: c.ghost,
      link: c.link,
      soft: c.soft,
      dash: c.dash,
    })),
    defaultVariants: {
      variant: "default",
    },
  }
)

type BadgeProps = React.ComponentProps<typeof View> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }

function Badge({ className, variant = "default", color, asChild = false, children, ...props }: BadgeProps) {
  const Comp = asChild ? SlotView : View

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-color={color ?? undefined}
      className={cn(badgeVariants({ variant, color }), className)}
      {...props}
    >
      {asChild ? children : renderTextChildren(children, undefined, { numberOfLines: 1 })}
    </Comp>
  )
}

export { Badge, badgeVariants, type BadgeProps }
