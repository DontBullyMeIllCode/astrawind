import * as React from "react"
import * as SwitchPrimitive from "@rn-primitives/switch"
import { styled } from "@astrawind/css"
import { useFieldControl } from "../lib/field-control"
import { useControllableState } from "../lib/use-controllable-state"
import { cn } from "../lib/utils"

const SwitchRoot = styled(SwitchPrimitive.Root, { interactive: true })
const SwitchThumb = styled(SwitchPrimitive.Thumb)

/** A larger touch target around the small track. */
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

type SwitchProps = Omit<React.ComponentProps<typeof SwitchRoot>, "checked" | "onCheckedChange"> & {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  size?: "sm" | "default"
}

function Switch({
  className,
  size = "default",
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  ...props
}: SwitchProps) {
  const [checked, setChecked] = useControllableState({
    prop: checkedProp,
    defaultProp: defaultChecked,
    onChange: onCheckedChange,
  })
  const state = checked ? "checked" : "unchecked"
  // Pressing a `<Label htmlFor>` or the enclosing FieldLabel toggles it, like a web `<label>`.
  useFieldControl({ press: () => setChecked(!checked), checked: !!checked, disabled: !!disabled }, props.nativeID)

  return (
    <SwitchRoot
      data-slot="switch"
      data-size={size}
      data-state={state}
      data-disabled={disabled ? "" : undefined}
      role="switch"
      aria-checked={checked}
      checked={checked}
      onCheckedChange={setChecked}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      className={cn(
        "peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
        className
      )}
      {...props}
    >
      <SwitchThumb
        data-slot="switch-thumb"
        data-state={state}
        style={{ pointerEvents: "none" }}
        className={cn(
          // `translate-x-[calc(100%-2px)]` (the thumb's width less 2px) as a length for each size:
          // 16px - 2px and 12px - 2px. `transition-transform` animates it.
          "pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-[state=checked]:translate-x-3.5 group-data-[size=sm]/switch:data-[state=checked]:translate-x-2.5 data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground"
        )}
      />
    </SwitchRoot>
  )
}

export { Switch, type SwitchProps }
