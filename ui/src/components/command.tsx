import * as React from "react"
import { SearchIcon } from "lucide-react-native"
import { Pressable, ScrollView, Text, TextInput, View } from "@astrawind/css"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog"
import { Icon } from "./icon"
import { renderTextChildren, textOf } from "../lib/children"
import { useControllableState } from "../lib/use-controllable-state"
import { cn } from "../lib/utils"

/**
 * A React Native stand-in for `cmdk`: the same parts and props, filtering items
 * as the search changes. There is no keyboard navigation; an item is selected
 * (`data-selected=true`) when it's pressed or hovered, as cmdk selects on pointer move.
 */

type ViewProps = React.ComponentProps<typeof View>
type TextProps = React.ComponentProps<typeof Text>

type CommandFilter = (value: string, search: string, keywords?: string[]) => number

/** Substring matches score 1, in-order character matches 0.5 (cmdk scores fuzzily too). */
const defaultFilter: CommandFilter = (value, search, keywords) => {
  const haystack = [value, ...(keywords ?? [])].join(" ").toLowerCase()
  const needle = search.trim().toLowerCase()
  if (!needle) return 1
  if (haystack.includes(needle)) return 1
  let i = 0
  for (const ch of haystack) if (ch === needle[i]) i++
  return i === needle.length ? 0.5 : 0
}

interface CommandContextValue {
  search: string
  setSearch: (search: string) => void
  matches: (value: string, keywords?: string[]) => boolean
  /** The selected item's value (cmdk's `value`). */
  value: string
  setValue: (value: string) => void
  registerItem: (id: string, group: string | undefined) => void
  unregisterItem: (id: string) => void
  registerGroup: (id: string) => void
  unregisterGroup: (id: string) => void
  visibleCount: number
  isGroupVisible: (group: string) => boolean
  /** Whether a visible group comes before this one. */
  followsVisibleGroup: (group: string) => boolean
  /** Inside a CommandDialog, which restyles the parts (`[&_[cmdk-*]]:*` on web). */
  dialog: boolean
}

const CommandContext = React.createContext<CommandContextValue | null>(null)
const CommandGroupContext = React.createContext<string | undefined>(undefined)
const CommandDialogContext = React.createContext(false)

function useCommand() {
  const ctx = React.useContext(CommandContext)
  if (!ctx) throw new Error("Command components must be used within <Command>.")
  return ctx
}

type CommandProps = ViewProps & {
  /** The selected item's value. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Ranks an item against the search; 0 hides it. */
  filter?: CommandFilter
  /** Set to false to filter the items yourself. */
  shouldFilter?: boolean
  label?: string
  /** Keyboard navigation wraps around on web; accepted for API parity. */
  loop?: boolean
}

function Command({
  className,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  filter = defaultFilter,
  shouldFilter = true,
  label,
  loop: _loop,
  ...props
}: CommandProps) {
  const dialog = React.useContext(CommandDialogContext)
  const [value, setValue] = useControllableState({ prop: valueProp, defaultProp: defaultValue, onChange: onValueChange })
  const [search, setSearch] = React.useState("")
  const [visible, setVisible] = React.useState<ReadonlyMap<string, string | undefined>>(new Map())
  const [groups, setGroups] = React.useState<readonly string[]>([])

  const registerItem = React.useCallback((id: string, group: string | undefined) => {
    setVisible((prev) => {
      if (prev.has(id) && prev.get(id) === group) return prev
      const next = new Map(prev)
      next.set(id, group)
      return next
    })
  }, [])
  const unregisterItem = React.useCallback((id: string) => {
    setVisible((prev) => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])
  const registerGroup = React.useCallback((id: string) => {
    setGroups((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])
  const unregisterGroup = React.useCallback((id: string) => {
    setGroups((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : prev))
  }, [])

  const context = React.useMemo<CommandContextValue>(() => {
    const isGroupVisible = (group: string) => {
      for (const g of visible.values()) if (g === group) return true
      return false
    }
    return {
      search,
      setSearch,
      matches: (v, keywords) => !shouldFilter || !search || filter(v, search, keywords) > 0,
      value,
      setValue,
      registerItem,
      unregisterItem,
      registerGroup,
      unregisterGroup,
      visibleCount: visible.size,
      isGroupVisible,
      followsVisibleGroup: (group) => {
        const index = groups.indexOf(group)
        return index > 0 && groups.slice(0, index).some(isGroupVisible)
      },
      dialog,
    }
  }, [search, shouldFilter, filter, value, setValue, registerItem, unregisterItem, registerGroup, unregisterGroup, visible, groups, dialog])

  return (
    <CommandContext.Provider value={context}>
      <View
        data-slot="command"
        aria-label={label}
        className={cn(
          // `h-full` fills CommandDialog; standalone, a percentage height would resolve against the
          // parent's layout on native, where CSS ignores it for an auto-height parent.
          "flex w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
          dialog && "h-full",
          className
        )}
        {...props}
      />
    </CommandContext.Provider>
  )
}

type CommandDialogProps = Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  children?: React.ReactNode
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = true,
  ...props
}: CommandDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent className={cn("overflow-hidden p-0", className)} showCloseButton={showCloseButton}>
        {/* Upstream renders the header next to the content; the dialog primitive needs it inside on native. */}
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {/* The Command's `**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-*]]:*` classes are applied by each part. */}
        <CommandDialogContext.Provider value>
          <Command>{children}</Command>
        </CommandDialogContext.Provider>
      </DialogContent>
    </Dialog>
  )
}

type CommandInputProps = Omit<React.ComponentProps<typeof TextInput>, "value"> & {
  /** The search (cmdk's controlled `value`). */
  value?: string
  onValueChange?: (search: string) => void
  disabled?: boolean
}

function CommandInput({ className, value: valueProp, onValueChange, onChangeText, disabled, ...props }: CommandInputProps) {
  const { search, setSearch, dialog } = useCommand()
  // A controlled search mirrors into the root, so the items filter.
  React.useEffect(() => {
    if (valueProp !== undefined && valueProp !== search) setSearch(valueProp)
  }, [valueProp, search, setSearch])
  const isDisabled = disabled || props.editable === false
  return (
    <View
      data-slot="command-input-wrapper"
      // In a dialog: `**:data-[slot=command-input-wrapper]:h-12`.
      className={cn("flex h-9 items-center gap-2 border-b px-3", dialog && "h-12")}
    >
      {/* In a dialog: `[&_[cmdk-input-wrapper]_svg]:h-5 w-5`. */}
      <Icon as={SearchIcon} className={cn("size-4 shrink-0 opacity-50", dialog && "size-5")} />
      <TextInput
        data-slot="command-input"
        role="searchbox"
        autoCorrect={false}
        autoCapitalize="none"
        value={valueProp ?? search}
        onChangeText={(text) => {
          setSearch(text)
          onValueChange?.(text)
          onChangeText?.(text)
        }}
        editable={!isDisabled}
        aria-disabled={isDisabled || undefined}
        className={cn(
          // `flex-1`: React Native's flex-shrink defaults to 0, so `w-full` would overflow next to the icon.
          "flex h-10 w-full flex-1 rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          // In a dialog: `[&_[cmdk-input]]:h-12`.
          dialog && "h-12",
          className
        )}
        {...props}
      />
    </View>
  )
}

function CommandList({ className, children, ...props }: React.ComponentProps<typeof ScrollView>) {
  return (
    <ScrollView
      data-slot="command-list"
      role="list"
      keyboardShouldPersistTaps="handled"
      // `grow-0`: a ScrollView grows to fill its parent on native; `max-h-[300px]` caps it.
      className={cn("max-h-[300px] grow-0 scroll-py-1 overflow-x-hidden overflow-y-auto", className)}
      {...props}
    >
      {children}
    </ScrollView>
  )
}

function CommandEmpty({ className, children, ...props }: ViewProps) {
  const { visibleCount } = useCommand()
  if (visibleCount > 0) return null
  return (
    <View data-slot="command-empty" role="presentation" className={cn("py-6 text-center text-sm", className)} {...props}>
      {renderTextChildren(children, "text-center")}
    </View>
  )
}

type CommandGroupProps = ViewProps & {
  heading?: React.ReactNode
  value?: string
  forceMount?: boolean
}

function CommandGroup({ className, heading, children, forceMount, value: _value, ...props }: CommandGroupProps) {
  const id = React.useId()
  const { isGroupVisible, followsVisibleGroup, registerGroup, unregisterGroup, dialog } = useCommand()
  React.useLayoutEffect(() => {
    registerGroup(id)
    return () => unregisterGroup(id)
  }, [id, registerGroup, unregisterGroup])
  // cmdk hides groups with no matching items.
  const hidden = !forceMount && !isGroupVisible(id)
  return (
    <CommandGroupContext.Provider value={id}>
      <View
        data-slot="command-group"
        role="group"
        aria-label={typeof heading === "string" ? heading : undefined}
        className={cn(
          "overflow-hidden p-1 text-foreground",
          // In a dialog: `[&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0`.
          dialog && "px-2",
          dialog && followsVisibleGroup(id) && "pt-0",
          hidden && "hidden",
          className
        )}
        {...props}
      >
        {heading != null && (
          // `[&_[cmdk-group-heading]]:*`, and in a dialog `[&_[cmdk-group-heading]]:px-2 font-medium text-muted-foreground`.
          <Text data-slot="command-group-heading" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            {heading}
          </Text>
        )}
        {children}
      </View>
    </CommandGroupContext.Provider>
  )
}

function CommandSeparator({ className, alwaysRender, ...props }: ViewProps & { alwaysRender?: boolean }) {
  const { search } = useCommand()
  // cmdk hides separators while searching.
  if (search && !alwaysRender) return null
  return <View data-slot="command-separator" role="separator" className={cn("-mx-1 h-px bg-border", className)} {...props} />
}

type CommandItemProps = Omit<React.ComponentProps<typeof Pressable>, "children"> & {
  children?: React.ReactNode
  value?: string
  keywords?: string[]
  onSelect?: (value: string) => void
  disabled?: boolean
  forceMount?: boolean
}

function CommandItem({
  className,
  children,
  value: valueProp,
  keywords,
  onSelect,
  disabled,
  forceMount,
  onPress,
  onPressIn,
  onHoverIn,
  ...props
}: CommandItemProps) {
  const ctx = useCommand()
  const group = React.useContext(CommandGroupContext)
  const id = React.useId()
  const value = (valueProp ?? textOf(children)).trim()
  const visible = forceMount || ctx.matches(value, keywords)
  const { registerItem, unregisterItem, setValue, dialog } = ctx

  React.useLayoutEffect(() => {
    if (!visible) return
    registerItem(id, group)
    return () => unregisterItem(id)
  }, [visible, id, group, registerItem, unregisterItem])

  if (!visible) return null
  const selected = !disabled && !!value && ctx.value === value
  return (
    <Pressable
      data-slot="command-item"
      data-selected={selected ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(
        // `[&_svg:not([class*='text-'])]:` → `[&_svg]:` (the default icon color, which an icon's own `text-*` overrides).
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-muted-foreground",
        // In a dialog: `[&_[cmdk-item]]:px-2 py-3 [&_[cmdk-item]_svg]:h-5 w-5`.
        dialog && "px-2 py-3 [&_svg]:size-5",
        className
      )}
      // The selection follows the pointer and the finger, as cmdk's does.
      onPressIn={(e) => {
        setValue(value)
        onPressIn?.(e)
      }}
      onHoverIn={(e) => {
        setValue(value)
        onHoverIn?.(e)
      }}
      onPress={(e) => {
        onPress?.(e)
        onSelect?.(value)
      }}
      {...props}
    >
      {renderTextChildren(children)}
    </Pressable>
  )
}

function CommandShortcut({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="command-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
  type CommandProps,
  type CommandDialogProps,
  type CommandInputProps,
  type CommandGroupProps,
  type CommandItemProps,
}
