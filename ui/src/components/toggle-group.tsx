import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import * as ToggleGroupPrimitive from "@rn-primitives/toggle-group"
import { styled } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { usePosition, withPositions } from "../lib/position"
import { useControllableState } from "../lib/use-controllable-state"
import { cn } from "../lib/utils"
import { toggleVariants } from "./toggle"

const ToggleGroupRoot = styled(ToggleGroupPrimitive.Root)
const ToggleGroupItemRoot = styled(ToggleGroupPrimitive.Item, { interactive: true })

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
})

type ToggleGroupBaseProps = Omit<
  React.ComponentProps<typeof ToggleGroupRoot>,
  "type" | "value" | "onValueChange" | "defaultValue"
> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
    children?: React.ReactNode
  }

type ToggleGroupSingleProps = {
  type: "single"
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

type ToggleGroupMultipleProps = {
  type: "multiple"
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

type ToggleGroupProps = ToggleGroupBaseProps & (ToggleGroupSingleProps | ToggleGroupMultipleProps)

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  type,
  value: valueProp,
  defaultValue,
  onValueChange,
  orientation,
  children,
  ...props
}: ToggleGroupProps) {
  // Radix's single group reports "" when its item is turned off.
  const [value, setValue] = useControllableState<string | string[]>({
    prop: valueProp,
    defaultProp: defaultValue ?? (type === "multiple" ? [] : ""),
    onChange: onValueChange as (value: string | string[]) => void,
  })
  const primitive =
    type === "multiple"
      ? { type, value: value as string[], onValueChange: (v: string[]) => setValue(v) }
      : { type, value: (value as string) || undefined, onValueChange: (v: string | undefined) => setValue(v ?? "") }

  return (
    <ToggleGroupRoot
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      aria-orientation={orientation}
      {...primitive}
      className={cn(
        // `gap-[--spacing(var(--gap))]` with `--gap: spacing`, as a spacing class.
        "group/toggle-group flex w-fit items-center rounded-md data-[spacing=default]:data-[variant=outline]:shadow-xs",
        `gap-${spacing}`,
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, spacing }}>
        {withPositions(children, "toggle-group")}
      </ToggleGroupContext.Provider>
    </ToggleGroupRoot>
  )
}

type ToggleGroupItemProps = Omit<React.ComponentProps<typeof ToggleGroupItemRoot>, "children"> &
  VariantProps<typeof toggleVariants> & { children?: React.ReactNode }

function ToggleGroupItem({ className, children, variant, size, value, disabled, ...props }: ToggleGroupItemProps) {
  const context = React.useContext(ToggleGroupContext)
  const root = ToggleGroupPrimitive.useRootContext()
  const pos = usePosition("toggle-group")
  const first = pos?.first ?? true
  const last = pos?.last ?? true
  const on = ToggleGroupPrimitive.utils.getIsSelected(root.value, value)

  return (
    <ToggleGroupItemRoot
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      data-state={on ? "on" : "off"}
      data-disabled={disabled || root.disabled ? "" : undefined}
      value={value}
      // Radix disables every item of a disabled group (and styles them with `disabled:`).
      disabled={disabled || root.disabled}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        "w-auto min-w-0 shrink-0 px-3 focus:z-10 focus-visible:z-10",
        // `first:` / `last:` from the item's position in the group.
        "data-[spacing=0]:rounded-none data-[spacing=0]:shadow-none",
        first && "data-[spacing=0]:rounded-l-md",
        last && "data-[spacing=0]:rounded-r-md",
        "data-[spacing=0]:data-[variant=outline]:border-l-0",
        first && "data-[spacing=0]:data-[variant=outline]:border-l",
        className
      )}
      {...props}
    >
      {renderTextChildren(children, undefined, { numberOfLines: 1 })}
    </ToggleGroupItemRoot>
  )
}

export { ToggleGroup, ToggleGroupItem, type ToggleGroupProps, type ToggleGroupItemProps }
