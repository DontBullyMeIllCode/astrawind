import * as React from "react"
import { BackHandler, Platform } from "react-native"
import { CheckIcon, ChevronDownIcon } from "lucide-react-native"
import { Portal } from "@rn-primitives/portal"
import { Pressable, ScrollView, Text, View } from "@astrawind/css"
import { textOf } from "../lib/children"
import { CenteredOverlayLayout, useOpenAnimation, usePresence } from "../lib/overlay"
import { useControllableState } from "../lib/use-controllable-state"
import { cn } from "../lib/utils"
import { Icon } from "./icon"

/*
 * React Native has no <select>. NativeSelect renders a trigger styled like
 * upstream's select that opens the options in a list over the screen, like
 * Android's native picker dialog. Options are declared as on the web, with
 * NativeSelectOption and NativeSelectOptGroup.
 */

type NativeSelectOptionProps = {
  value?: string
  /** The option's text; defaults to its children's text. */
  label?: string
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

type NativeSelectOptGroupProps = {
  label?: string
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

interface OptionData {
  value: string
  label: string
  disabled: boolean
  className?: string
  group?: { label?: string; className?: string }
}

/** Declares an option. NativeSelect's list renders it, like a <select> renders its <option>s. */
function NativeSelectOption(_props: NativeSelectOptionProps): React.ReactElement | null {
  return null
}

/** Declares a group of options, like <optgroup>. */
function NativeSelectOptGroup(_props: NativeSelectOptGroupProps): React.ReactElement | null {
  return null
}

function collectOptions(children: React.ReactNode, group?: NativeSelectOptGroupProps, out: OptionData[] = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === NativeSelectOption) {
      const p = child.props as NativeSelectOptionProps
      const label = p.label ?? textOf(p.children)
      out.push({
        value: p.value ?? label,
        label,
        disabled: !!(p.disabled || group?.disabled),
        className: p.className,
        group: group && { label: group.label, className: group.className },
      })
    } else if (child.type === NativeSelectOptGroup) {
      collectOptions((child.props as NativeSelectOptGroupProps).children, child.props as NativeSelectOptGroupProps, out)
    } else if (child.type === React.Fragment) {
      collectOptions((child.props as { children?: React.ReactNode }).children, group, out)
    }
  })
  return out
}

type NativeSelectProps = Omit<React.ComponentProps<typeof Pressable>, "children" | "onPress"> & {
  size?: "sm" | "default"
  value?: string
  defaultValue?: string
  /** Called with the chosen option's value (web: `onChange(e)` with `e.target.value`). */
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

function NativeSelect({
  className,
  size = "default",
  value: valueProp,
  defaultValue,
  onValueChange,
  disabled,
  children,
  ...props
}: NativeSelectProps) {
  const options = collectOptions(children)
  const [value, setValue] = useControllableState<string | undefined>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange as ((v: string | undefined) => void) | undefined,
  })
  const [open, setOpen] = React.useState(false)
  // Like a <select>, the first enabled option shows when nothing is selected.
  const selected = options.find((o) => o.value === value) ?? options.find((o) => !o.disabled)
  const portalName = `native-select-${React.useId()}`

  return (
    <View
      // `has-[select:disabled]` → `has-[:disabled]`: the trigger is written below with `disabled`.
      className="group/native-select relative w-fit has-[:disabled]:opacity-50"
      data-slot="native-select-wrapper"
    >
      <Pressable
        data-slot="native-select"
        data-size={size}
        role="combobox"
        aria-expanded={open}
        aria-disabled={disabled ?? undefined}
        disabled={disabled}
        onPress={() => options.length && setOpen(true)}
        className={cn(
          // `flex-row items-center` lays out the selected option's text, which a <select> draws itself.
          "h-9 w-full min-w-0 flex-row items-center appearance-none rounded-md border border-input bg-transparent px-3 py-2 pr-9 text-sm shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed data-[size=sm]:h-8 data-[size=sm]:py-1 dark:bg-input/30 dark:hover:bg-input/50 dark:active:bg-input/50",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
      >
        <Text numberOfLines={1}>{selected?.label ?? ""}</Text>
      </Pressable>
      {/* `select-none` is left out: on an icon it becomes a `selectable` prop the SVG doesn't take. */}
      <Icon
        as={ChevronDownIcon}
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground opacity-50"
        aria-hidden
        data-slot="native-select-icon"
      />
      <NativeSelectList
        portalName={portalName}
        open={open}
        options={options}
        selected={selected?.value}
        onSelect={(v) => {
          setValue(v)
          setOpen(false)
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  )
}

function NativeSelectList({
  portalName,
  open,
  options,
  selected,
  onSelect,
  onClose,
}: {
  portalName: string
  open: boolean
  options: OptionData[]
  selected?: string
  onSelect: (value: string) => void
  onClose: () => void
}) {
  const { present, onExited } = usePresence(open)

  // Android's back button closes the list; on web (which has no BackHandler), Escape does.
  React.useEffect(() => {
    if (!open) return
    if (Platform.OS === "web") {
      type KeyTarget = { addEventListener(t: string, f: (e: { key: string }) => void): void; removeEventListener(t: string, f: (e: { key: string }) => void): void }
      const doc = (globalThis as unknown as { document?: KeyTarget }).document
      const onKey = (e: { key: string }) => {
        if (e.key === "Escape") onClose()
      }
      doc?.addEventListener("keydown", onKey)
      return () => doc?.removeEventListener("keydown", onKey)
    }
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose()
      return true
    })
    return () => sub.remove()
  }, [open, onClose])

  if (!present) return null
  return (
    <Portal name={portalName}>
      <NativeSelectListLayer open={open} onExited={onExited} onClose={onClose}>
        <View
          role="list"
          data-slot="native-select-content"
          className="mx-auto max-h-96 w-full max-w-xs overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          <ScrollView contentContainerClassName="p-1">
            {options.map((o, i) => {
              const header = o.group?.label !== undefined && o.group !== options[i - 1]?.group ? o.group : undefined
              const isSelected = o.value === selected
              return (
                <React.Fragment key={`${i}:${o.value}`}>
                  {header ? (
                    <Text
                      data-slot="native-select-optgroup"
                      className={cn("px-2 py-1.5 text-xs text-muted-foreground", header.className)}
                    >
                      {header.label}
                    </Text>
                  ) : null}
                  <Pressable
                    data-slot="native-select-option"
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={o.disabled || undefined}
                    disabled={o.disabled}
                    onPress={() => onSelect(o.value)}
                    className={cn(
                      // `bg-[Canvas] text-[CanvasText]` (the system's colors) → the popover's.
                      "relative flex w-full flex-row items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm text-popover-foreground outline-hidden select-none hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                      o.className
                    )}
                  >
                    <Text numberOfLines={1}>{o.label}</Text>
                    {isSelected ? (
                      <View className="absolute right-2 flex size-3.5 items-center justify-center">
                        <Icon as={CheckIcon} className="size-4" />
                      </View>
                    ) : null}
                  </Pressable>
                </React.Fragment>
              )
            })}
          </ScrollView>
        </View>
      </NativeSelectListLayer>
    </Portal>
  )
}

function NativeSelectListLayer({
  open,
  onExited,
  onClose,
  children,
}: {
  open: boolean
  onExited: () => void
  onClose: () => void
  children: React.ReactNode
}) {
  const progress = useOpenAnimation(open, onExited)
  return (
    <CenteredOverlayLayout
      progress={progress}
      overlay={<Pressable aria-label="Close" onPress={onClose} className="absolute inset-0 bg-black/50" />}
    >
      {children}
    </CenteredOverlayLayout>
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption, type NativeSelectProps }
