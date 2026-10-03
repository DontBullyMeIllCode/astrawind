import * as React from "react"
import * as CheckboxPrimitive from "@rn-primitives/checkbox"
import { CheckIcon } from "lucide-react-native"
import { styled } from "@astrawind/css"
import { useFieldControl } from "../lib/field-control"
import { useControllableState } from "../lib/use-controllable-state"
import { cn } from "../lib/utils"
import { Icon } from "./icon"

const CheckboxRoot = styled(CheckboxPrimitive.Root, { interactive: true })
const CheckboxIndicator = styled(CheckboxPrimitive.Indicator)

type CheckedState = boolean | "indeterminate"

/** A larger touch target around the 16px box. */
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

type CheckboxProps = Omit<React.ComponentProps<typeof CheckboxRoot>, "checked" | "onCheckedChange"> & {
  checked?: CheckedState
  defaultChecked?: CheckedState
  onCheckedChange?: (checked: CheckedState) => void
}

function Checkbox({
  className,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  ...props
}: CheckboxProps) {
  const [checked, setChecked] = useControllableState<CheckedState>({
    prop: checkedProp,
    defaultProp: defaultChecked,
    onChange: onCheckedChange,
  })
  const indeterminate = checked === "indeterminate"
  const state = indeterminate ? "indeterminate" : checked ? "checked" : "unchecked"
  // Pressing a `<Label htmlFor>` or the enclosing FieldLabel toggles it, like a web `<label>`.
  useFieldControl({ press: () => setChecked(checked !== true), checked: checked === true, disabled: !!disabled }, props.nativeID)

  return (
    <CheckboxRoot
      data-slot="checkbox"
      data-state={state}
      data-disabled={disabled ? "" : undefined}
      aria-checked={indeterminate ? "mixed" : checked === true}
      checked={checked === true}
      // Like Radix: an indeterminate checkbox becomes checked.
      onCheckedChange={(next) => setChecked(indeterminate ? true : next)}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxIndicator
        data-slot="checkbox-indicator"
        data-state={state}
        // Radix shows the indicator while indeterminate too.
        forceMount={indeterminate || undefined}
        // `items-center` centers the icon horizontally, as `place-content-center` does in a grid.
        className="grid place-content-center items-center text-current transition-none"
      >
        <Icon as={CheckIcon} className="size-3.5" />
      </CheckboxIndicator>
    </CheckboxRoot>
  )
}

export { Checkbox, type CheckboxProps, type CheckedState }
