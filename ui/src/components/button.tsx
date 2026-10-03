import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@rn-primitives/slot"
import { Pressable, styled } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { colorCompounds, neutralStyles, type Color } from "../lib/colors"
import { cn } from "../lib/utils"

const SlotPressable = styled(Slot.Pressable, { interactive: true })

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 active:bg-destructive/90 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground active:bg-accent dark:border-input dark:bg-input/30 dark:hover:bg-input/50 dark:active:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent dark:hover:bg-accent/50 dark:active:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline active:underline",
        // daisyUI's styles (not in shadcn): a tint of the color, and a dashed outline. Without a
        // `color`, in the foreground color.
        soft: `${neutralStyles.soft} ${neutralStyles.press}`,
        dash: `${neutralStyles.dash} ${neutralStyles.press}`,
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
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    compoundVariants: colorCompounds((c) => ({
      default: `${c.solid} ${c.solidPress}`,
      // shadcn's outline and ghost have their own dark-mode backgrounds; the color replaces them.
      outline: `${c.outline} shadow-xs ${c.fill} ${c.dark(`${c.outline} ${c.fill}`)} ${c.fillDark}`,
      ghost: `${c.ghost} ${c.ghostPress} ${c.dark(c.ghostPress)}`,
      link: c.link,
      soft: `${c.soft} ${c.fill} ${c.fillDark}`,
      dash: `${c.dash} ${c.fill} ${c.fillDark}`,
    })),
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = Omit<React.ComponentProps<typeof Pressable>, "children"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    children?: React.ReactNode
  }

function Button({
  className,
  variant = "default",
  size = "default",
  color,
  asChild = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? SlotPressable : Pressable

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-color={color ?? undefined}
      data-size={size}
      role="button"
      disabled={disabled}
      aria-disabled={disabled ?? undefined}
      className={cn(buttonVariants({ variant, size, color, className }))}
      {...props}
    >
      {/* `whitespace-nowrap`: keep the label on one line. */}
      {asChild ? children : renderTextChildren(children, undefined, { numberOfLines: 1 })}
    </Comp>
  )
}

export { Button, buttonVariants, type ButtonProps }
