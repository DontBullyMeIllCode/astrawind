import * as React from "react"
import { Pressable, Text, toNativeColor, View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@astrawind/ui/dropdown-menu"

export type PickerOption = {
  value: string
  label: string
  /** A color (any CSS color, e.g. oklch) shown as a swatch. */
  swatch?: string
}

/** A round color swatch. */
export function Swatch({ color, className }: { color?: string; className?: string }) {
  if (!color) return null
  return (
    <View
      aria-hidden
      className={cn("size-4 shrink-0 rounded-full border border-foreground/10", className)}
      style={{ backgroundColor: toNativeColor(color) ?? undefined }}
    />
  )
}

/**
 * A customizer row, like upstream's picker: the label, the current value and a
 * swatch or icon, opening a menu of options. Groups are separated by a line.
 */
export function Picker({
  label,
  value,
  groups,
  onValueChange,
  indicator,
  className,
}: {
  label: string
  value: string
  groups: { label?: string; options: PickerOption[] }[]
  onValueChange: (value: string) => void
  /** Shown on the right of the trigger instead of the current option's swatch. */
  indicator?: React.ReactNode
  className?: string
}) {
  const current = groups.flatMap((g) => g.options).find((o) => o.value === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Pressable
          aria-label={`${label}: ${current?.label ?? value}`}
          className={cn(
            "w-36 shrink-0 flex-row items-center gap-2 rounded-xl border border-foreground/10 p-3 select-none hover:bg-muted active:bg-muted md:w-full md:rounded-lg md:px-2.5 md:py-2",
            className
          )}
        >
          <View className="min-w-0 flex-1">
            <Text className="text-xs text-muted-foreground">{label}</Text>
            <Text numberOfLines={1} className="text-sm font-medium text-foreground">
              {current?.label ?? value}
            </Text>
          </View>
          {indicator ?? <Swatch color={current?.swatch} />}
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 max-h-96">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {groups.map((group, i) => (
            <React.Fragment key={group.label ?? i}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuGroup>
                {group.label ? <DropdownMenuLabel className="text-xs text-muted-foreground">{group.label}</DropdownMenuLabel> : null}
                {group.options.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    <Text className="flex-1">{option.label}</Text>
                    <Swatch color={option.swatch} className="size-3.5" />
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuGroup>
            </React.Fragment>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
