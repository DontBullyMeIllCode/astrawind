import * as React from "react"
import * as RadioGroupPrimitive from "@rn-primitives/radio-group"
import { CircleIcon } from "lucide-react-native"
import { styled } from "@astrawind/css"
import { useFieldControl } from "../lib/field-control"
import { useControllableState } from "../lib/use-controllable-state"
import { cn } from "../lib/utils"
import { Icon } from "./icon"

const RadioGroupRoot = styled(RadioGroupPrimitive.Root)
const RadioGroupItemRoot = styled(RadioGroupPrimitive.Item, { interactive: true })
const RadioGroupIndicator = styled(RadioGroupPrimitive.Indicator)

/** A larger touch target around the 16px circle. */
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

const RadioGroupContext = React.createContext<{
  value: string | undefined
  disabled?: boolean
  select?: (value: string) => void
}>({ value: undefined })

type RadioGroupProps = Omit<React.ComponentProps<typeof RadioGroupRoot>, "value" | "onValueChange"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: "horizontal" | "vertical"
}

function RadioGroup({
  className,
  value: valueProp,
  defaultValue,
  onValueChange,
  disabled,
  orientation,
  ...props
}: RadioGroupProps) {
  const [value, setValue] = useControllableState<string | undefined>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange as (value: string | undefined) => void,
  })
  const ctx = React.useMemo(() => ({ value, disabled, select: setValue }), [value, disabled, setValue])

  return (
    <RadioGroupContext.Provider value={ctx}>
      <RadioGroupRoot
        data-slot="radio-group"
        data-disabled={disabled ? "" : undefined}
        data-orientation={orientation}
        role="radiogroup"
        aria-orientation={orientation}
        value={value}
        onValueChange={setValue}
        disabled={disabled}
        className={cn("grid gap-3", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  )
}

function RadioGroupItem({ className, value, disabled: disabledProp, ...props }: React.ComponentProps<typeof RadioGroupItemRoot>) {
  const ctx = React.useContext(RadioGroupContext)
  const checked = ctx.value === value
  const disabled = !!(disabledProp || ctx.disabled)
  const state = checked ? "checked" : "unchecked"
  // Pressing a `<Label htmlFor>` or the enclosing FieldLabel selects it, like a web `<label>`.
  useFieldControl({ press: () => ctx.select?.(value), checked, disabled }, props.nativeID)

  return (
    <RadioGroupItemRoot
      data-slot="radio-group-item"
      data-state={state}
      data-disabled={disabled ? "" : undefined}
      role="radio"
      aria-checked={checked}
      value={value}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      className={cn(
        "aspect-square size-4 shrink-0 rounded-full border border-input text-primary shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    >
      <RadioGroupIndicator
        data-slot="radio-group-indicator"
        data-state={state}
        // `flex-1`: fill the item, so the dot's `top-1/2 left-1/2` centers it (on the web the
        // absolutely positioned dot centers against the item itself).
        className="relative flex flex-1 items-center justify-center"
      >
        <Icon as={CircleIcon} className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 fill-primary" />
      </RadioGroupIndicator>
    </RadioGroupItemRoot>
  )
}

export { RadioGroup, RadioGroupItem, type RadioGroupProps }
