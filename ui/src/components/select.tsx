import * as React from "react"
import {
  Platform,
  StyleSheet,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView as RNScrollView,
} from "react-native"
import * as SelectPrimitive from "@rn-primitives/select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react-native"
import { Pressable, ScrollView, styled, Text, View } from "@astrawind/css"
import { Icon } from "./icon"
import { renderTextChildren, textOf } from "../lib/children"
import { MenuPopupAnimation, ROOT_CONTENTS_STYLE, useAvailableHeight, useCollisionInsets, type CollisionPadding, type MenuSide } from "../lib/menu"
import { composeRefs, OpenSync, useControllableState, verticalSide, withHighlight, type Align } from "../lib/overlay"
import { cn } from "../lib/utils"

type WithClassName<P> = Omit<P, "children"> & { className?: string; children?: React.ReactNode }
type ViewProps = React.ComponentProps<typeof View>
type TextProps = React.ComponentProps<typeof Text>

const StyledTrigger = styled(SelectPrimitive.Trigger, { interactive: true }) as React.ComponentType<
  WithClassName<SelectPrimitive.TriggerProps> & { ref?: React.Ref<SelectPrimitive.TriggerRef> }
>
// On web the item is Radix's DOM element, which highlights on hover and focuses on press, so the
// `focus:` highlight follows its focus; native reports press and hover as focus instead.
const StyledItem = styled(Platform.OS === "web" ? SelectPrimitive.Item : withHighlight(SelectPrimitive.Item), {
  interactive: true,
  webDom: true,
}) as React.ComponentType<WithClassName<SelectPrimitive.ItemProps>>
const StyledGroup = styled(SelectPrimitive.Group) as React.ComponentType<WithClassName<SelectPrimitive.GroupProps>>
const StyledLabel = styled(SelectPrimitive.Label, { kind: "text" }) as React.ComponentType<
  WithClassName<SelectPrimitive.LabelProps>
>
const StyledSeparator = styled(SelectPrimitive.Separator) as React.ComponentType<
  WithClassName<SelectPrimitive.SeparatorProps>
>

interface SelectContextValue {
  value: string | undefined
  /** The text of the item with this value (what Radix shows in `SelectValue`). */
  labelOf: (value: string) => string
  triggerRef: React.RefObject<SelectPrimitive.TriggerRef | null>
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext() {
  const ctx = React.useContext(SelectContext)
  if (!ctx) throw new Error("Select components must be used within <Select>.")
  return ctx
}

/** Labels of the `SelectItem`s written in JSX under `<Select>`, so a default value shows its label before the list opens. */
function collectLabels(node: React.ReactNode, into: Record<string, string>) {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return
    const props = child.props as { value?: string; textValue?: string; children?: React.ReactNode }
    if (child.type === SelectItem && typeof props.value === "string") {
      into[props.value] = props.textValue ?? (textOf(props.children) || props.value)
      return
    }
    if (props.children) collectLabels(props.children, into)
  })
}

type SelectProps = Omit<SelectPrimitive.RootProps, "value" | "defaultValue" | "onValueChange" | "asChild"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
}

function Select({ value: valueProp, defaultValue, onValueChange, open, defaultOpen, onOpenChange, children, ...props }: SelectProps) {
  const [value, setValue] = useControllableState<string | undefined>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange as (value: string | undefined) => void,
  })
  const [picked, setPicked] = React.useState<Record<string, string>>({})
  const [isOpen, setIsOpen] = React.useState(false)
  const triggerRef = React.useRef<SelectPrimitive.TriggerRef | null>(null)

  const labels = React.useMemo(() => {
    const map: Record<string, string> = {}
    collectLabels(children, map)
    return map
  }, [children])
  // Labels written in JSX first: on web the primitive reports the value as the picked label.
  const labelOf = React.useCallback((v: string) => labels[v] ?? picked[v] ?? v, [picked, labels])
  const context = React.useMemo(() => ({ value, labelOf, triggerRef }), [value, labelOf])

  return (
    <SelectContext.Provider value={context}>
      <SelectPrimitive.Root
        data-slot="select"
        style={ROOT_CONTENTS_STYLE}
        value={value === undefined || value === "" ? undefined : { value, label: labelOf(value) }}
        onValueChange={(option) => {
          if (option) setPicked((p) => (p[option.value] === option.label ? p : { ...p, [option.value]: option.label }))
          setValue(option?.value)
        }}
        onOpenChange={(next) => {
          setIsOpen(next)
          onOpenChange?.(next)
        }}
        {...props}
      >
        {children}
        <OpenSync open={open} defaultOpen={defaultOpen} isOpen={isOpen} triggerRef={triggerRef} />
      </SelectPrimitive.Root>
    </SelectContext.Provider>
  )
}

function SelectGroup(props: WithClassName<SelectPrimitive.GroupProps>) {
  return <StyledGroup data-slot="select-group" {...props} />
}

function SelectValue({
  placeholder,
  children,
  ...props
}: Omit<TextProps, "children"> & {
  placeholder?: React.ReactNode
  children?: React.ReactNode
}) {
  const { value, labelOf } = useSelectContext()
  const hasValue = value !== undefined && value !== ""
  // `*:data-[slot=select-value]:line-clamp-1` (on the trigger) is `numberOfLines`.
  return (
    <Text data-slot="select-value" numberOfLines={1} {...props}>
      {children ?? (hasValue ? labelOf(value) : placeholder)}
    </Text>
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  disabled,
  ref,
  ...props
}: WithClassName<SelectPrimitive.TriggerProps> & {
  size?: "sm" | "default"
  ref?: React.Ref<SelectPrimitive.TriggerRef>
}) {
  const { value, triggerRef } = useSelectContext()
  const { open, disabled: rootDisabled } = SelectPrimitive.useRootContext()
  const isDisabled = !!(disabled || rootDisabled)
  return (
    <StyledTrigger
      ref={composeRefs(triggerRef, ref)}
      data-slot="select-trigger"
      data-size={size}
      data-state={open ? "open" : "closed"}
      data-placeholder={value === undefined || value === "" || undefined}
      data-disabled={isDisabled || undefined}
      role="combobox"
      aria-expanded={open}
      aria-disabled={isDisabled || undefined}
      disabled={isDisabled}
      className={cn(
        // `dark:active:bg-input/50` joins `dark:hover:bg-input/50` for touch; `[&_svg:not([class*='text-'])]:` → `[&_svg]:`
        // (the default icon color, which an icon's own `text-*` overrides).
        "flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:hover:bg-input/50 dark:active:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
      <Icon as={ChevronDownIcon} className="size-4 opacity-50" aria-hidden />
    </StyledTrigger>
  )
}

interface ScrollState {
  canScrollUp: boolean
  canScrollDown: boolean
  scrollBy: (direction: -1 | 1) => void
}

const SelectScrollContext = React.createContext<ScrollState | null>(null)

function SelectContent({
  className,
  children,
  position = "item-aligned",
  side = "bottom",
  sideOffset,
  align = "center",
  alignOffset = 0,
  avoidCollisions = true,
  collisionPadding,
  style,
  ...props
}: ViewProps & {
  /** `item-aligned` can't overlay the trigger on native; both positions open below or above it. */
  position?: "item-aligned" | "popper"
  side?: MenuSide
  sideOffset?: number
  align?: Align
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?: CollisionPadding
}) {
  const { triggerPosition } = SelectPrimitive.useRootContext() as {
    triggerPosition?: { width: number; pageY: number; height: number } | null
  }
  const vside = verticalSide(side)
  // Popper: Radix's `sideOffset` (0) plus the 4px `translate-*-1` classes. Item-aligned: a 4px gap.
  const offset = sideOffset ?? (position === "popper" ? 0 : 4)
  const insets = useCollisionInsets(collisionPadding)
  const maxHeight = useAvailableHeight(triggerPosition, offset + 4, insets)

  const scrollRef = React.useRef<RNScrollView | null>(null)
  const metrics = React.useRef({ offset: 0, height: 0, content: 0 })
  const [edges, setEdges] = React.useState({ up: false, down: false })
  const update = React.useCallback(() => {
    const { offset: y, height, content } = metrics.current
    const up = y > 1
    const down = y + height < content - 1
    setEdges((e) => (e.up === up && e.down === down ? e : { up, down }))
  }, [])
  const scroll = React.useMemo<ScrollState>(
    () => ({
      canScrollUp: edges.up,
      canScrollDown: edges.down,
      scrollBy: (direction) => {
        const { offset: y, height } = metrics.current
        scrollRef.current?.scrollTo({ y: Math.max(0, y + direction * height * 0.75), animated: true })
      },
    }),
    [edges]
  )

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Overlay style={Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined}>
        <SelectPrimitive.Content
          side={vside}
          align={align}
          sideOffset={offset}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          insets={insets}
          // Radix's item-aligned positioning needs a Select.Viewport, which @rn-primitives' web
          // content doesn't render (it leaves the list off-screen), so web always uses popper.
          position={Platform.OS === "web" ? "popper" : position}
        >
          <MenuPopupAnimation side={vside}>
            <View
              data-slot="select-content"
              data-side={vside}
              data-state="open"
              role="list"
              className={cn(
                // `max-h-(--radix-select-content-available-height)` is the `maxHeight` style; `origin-*` and the
                // `animate-in`/`fade-*`/`zoom-*`/`slide-in-*` classes are MenuPopupAnimation.
                "relative z-50 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md",
                position === "popper" &&
                  "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
                className
              )}
              // Radix's content is at least as wide as the trigger (`min-w-[var(--radix-select-trigger-width)]`).
              style={[
                {
                  maxHeight,
                  // Web: Radix sets the trigger's width as a variable on the popper wrapper.
                  minWidth: Platform.OS === "web" ? ("var(--radix-select-trigger-width)" as unknown as number) : triggerPosition?.width,
                },
                style,
              ]}
              {...props}
            >
              <SelectScrollContext.Provider value={scroll}>
                <SelectScrollUpButton />
                <ScrollView
                  ref={scrollRef}
                  bounces={false}
                  className="grow-0"
                  scrollEventThrottle={16}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                    metrics.current.offset = e.nativeEvent.contentOffset.y
                    update()
                  }}
                  onLayout={(e: LayoutChangeEvent) => {
                    metrics.current.height = e.nativeEvent.layout.height
                    update()
                  }}
                  onContentSizeChange={(_w: number, h: number) => {
                    metrics.current.content = h
                    update()
                  }}
                >
                  {/* Viewport. Popper's `h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1` is the content's `minWidth`. */}
                  <View className="p-1">{children}</View>
                </ScrollView>
                <SelectScrollDownButton />
              </SelectScrollContext.Provider>
            </View>
          </MenuPopupAnimation>
        </SelectPrimitive.Content>
      </SelectPrimitive.Overlay>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({ className, ...props }: WithClassName<SelectPrimitive.LabelProps>) {
  return <StyledLabel data-slot="select-label" className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)} {...props} />
}

function SelectItem({
  className,
  children,
  value,
  textValue,
  disabled,
  ...props
}: WithClassName<Omit<SelectPrimitive.ItemProps, "label">> & {
  /** The text shown in `SelectValue` when selected. Defaults to the children's text. */
  textValue?: string
}) {
  const { value: selected } = useSelectContext()
  const isSelected = selected === value
  return (
    <StyledItem
      data-slot="select-item"
      data-state={isSelected ? "checked" : "unchecked"}
      data-disabled={disabled || undefined}
      value={value}
      label={textValue ?? (textOf(children) || value)}
      disabled={disabled}
      className={cn(
        // `[&_svg:not([class*='text-'])]:` → `[&_svg]:` (the default icon color).
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-muted-foreground",
        className
      )}
      {...props}
    >
      <View data-slot="select-item-indicator" className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Icon as={CheckIcon} className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </View>
      {/* ItemText. `*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2` style it directly. */}
      <View className="flex items-center gap-2">{renderTextChildren(children)}</View>
    </StyledItem>
  )
}

function SelectSeparator({ className, ...props }: WithClassName<SelectPrimitive.SeparatorProps>) {
  return (
    <StyledSeparator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

type ScrollButtonProps = Omit<React.ComponentProps<typeof Pressable>, "children"> & { children?: React.ReactNode }

/** Shown while the list can scroll up; pressing it scrolls up (Radix scrolls while the pointer is over it). */
function SelectScrollUpButton({ className, children, ...props }: ScrollButtonProps) {
  const scroll = React.useContext(SelectScrollContext)
  if (!scroll?.canScrollUp) return null
  return (
    <Pressable
      data-slot="select-scroll-up-button"
      aria-hidden
      onPress={() => scroll.scrollBy(-1)}
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      {children ?? <Icon as={ChevronUpIcon} className="size-4" />}
    </Pressable>
  )
}

/** Shown while the list can scroll down; pressing it scrolls down. */
function SelectScrollDownButton({ className, children, ...props }: ScrollButtonProps) {
  const scroll = React.useContext(SelectScrollContext)
  if (!scroll?.canScrollDown) return null
  return (
    <Pressable
      data-slot="select-scroll-down-button"
      aria-hidden
      onPress={() => scroll.scrollBy(1)}
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      {children ?? <Icon as={ChevronDownIcon} className="size-4" />}
    </Pressable>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
