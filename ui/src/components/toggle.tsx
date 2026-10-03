import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as TogglePrimitive from "@rn-primitives/toggle"
import { styled } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { useControllableState } from "../lib/use-controllable-state"
import { cn } from "../lib/utils"

const ToggleRoot = styled(TogglePrimitive.Root, { interactive: true })

// `active:` classes mirror `hover:` for touch devices.
const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none hover:bg-muted hover:text-muted-foreground active:bg-muted active:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground",
      },
      size: {
        default: "h-9 min-w-9 px-2",
        sm: "h-8 min-w-8 px-1.5",
        lg: "h-10 min-w-10 px-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ToggleProps = Omit<React.ComponentProps<typeof ToggleRoot>, "pressed" | "onPressedChange" | "children"> &
  VariantProps<typeof toggleVariants> & {
    pressed?: boolean
    defaultPressed?: boolean
    onPressedChange?: (pressed: boolean) => void
    children?: React.ReactNode
  }

function Toggle({
  className,
  variant,
  size,
  pressed: pressedProp,
  defaultPressed = false,
  onPressedChange,
  disabled,
  children,
  ...props
}: ToggleProps) {
  const [pressed, setPressed] = useControllableState({
    prop: pressedProp,
    defaultProp: defaultPressed,
    onChange: onPressedChange,
  })

  return (
    <ToggleRoot
      data-slot="toggle"
      data-state={pressed ? "on" : "off"}
      data-disabled={disabled ? "" : undefined}
      pressed={pressed}
      onPressedChange={setPressed}
      disabled={disabled}
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    >
      {/* `whitespace-nowrap`: keep the label on one line. */}
      {renderTextChildren(children, undefined, { numberOfLines: 1 })}
    </ToggleRoot>
  )
}

export { Toggle, toggleVariants, type ToggleProps }
