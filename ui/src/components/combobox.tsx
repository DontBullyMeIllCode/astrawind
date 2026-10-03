import * as React from "react"
import {
  Keyboard,
  Pressable as RNPressable,
  StyleSheet,
  useWindowDimensions,
  View as RNView,
  type GestureResponderEvent,
  type TextInput as RNTextInput,
} from "react-native"
import { Portal } from "@rn-primitives/portal"
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react-native"
import { Pressable, ScrollView, Text, TextInput, View } from "@astrawind/css"
import { Button } from "./button"
import { Icon } from "./icon"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./input-group"
import { renderTextChildren, textOf } from "../lib/children"
import { useInsets } from "../lib/insets"
import { composeRefs } from "../lib/overlay"
import { SidePopupAnimation } from "../lib/popup"
import { useControllableState } from "../lib/use-controllable-state"
import { cn } from "../lib/utils"

/**
 * A React Native port of Base UI's Combobox: the same parts and props (the ones
 * that make sense without a keyboard). The popup is positioned below (or above)
 * the input, the chips or the trigger, and filters `items` as the input changes.
 */

type ViewProps = React.ComponentProps<typeof View>
type TextProps = React.ComponentProps<typeof Text>
type Item = any // eslint-disable-line @typescript-eslint/no-explicit-any
type Rect = { x: number; y: number; width: number; height: number }
type AnchorKind = "chips" | "input" | "trigger"

interface ComboboxContextValue {
  id: string
  open: boolean
  setOpen: (open: boolean) => void
  inputValue: string
  setInputValue: (value: string) => void
  multiple: boolean
  disabled: boolean
  value: Item
  values: Item[]
  isSelected: (item: Item) => boolean
  select: (item: Item) => void
  remove: (item: Item) => void
  clear: () => void
  labelOf: (item: Item) => string
  matches: (item: Item, label?: string) => boolean
  filteredItems: Item[] | undefined
  setAnchor: (kind: AnchorKind, node: RNView | null) => void
  getAnchor: () => { node: RNView | null; kind: AnchorKind | undefined }
  inputRef: React.RefObject<RNTextInput | null>
  registerItem: (id: string, group: string | undefined) => void
  unregisterItem: (id: string) => void
  visibleCount: number
  isGroupVisible: (group: string) => boolean
  focused: boolean
  setFocused: (focused: boolean) => void
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)
/** Set inside ComboboxContent: an input there is the popup's search field. */
const ComboboxInContentContext = React.createContext(false)
const ComboboxGroupContext = React.createContext<{ id: string; items?: Item[] } | null>(null)
const ComboboxListHeightContext = React.createContext<number | undefined>(undefined)

function useCombobox() {
  const ctx = React.useContext(ComboboxContext)
  if (!ctx) throw new Error("Combobox components must be used within <Combobox>.")
  return ctx
}

function isGroup(item: Item): item is { value?: unknown; items: Item[] } {
  return typeof item === "object" && item !== null && Array.isArray((item as { items?: unknown }).items)
}

function defaultLabel(item: Item): string {
  if (item == null) return ""
  if (typeof item === "object") {
    if (item.label != null) return String(item.label)
    if (item.value != null) return String(item.value)
  }
  return String(item)
}

function defaultKey(item: Item): unknown {
  if (typeof item === "object" && item !== null && "value" in item) return item.value
  return item
}

type ComboboxProps = {
  children?: React.ReactNode
  /** The items to filter; may be groups (`{ value, items }`). */
  items?: readonly Item[]
  multiple?: boolean
  value?: Item
  defaultValue?: Item
  onValueChange?: (value: Item) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  inputValue?: string
  defaultInputValue?: string
  onInputValueChange?: (value: string) => void
  itemToStringLabel?: (item: Item) => string
  itemToStringValue?: (item: Item) => string
  isItemEqualToValue?: (item: Item, value: Item) => boolean
  /** Return true to keep an item. `null` turns filtering off. */
  filter?: ((item: Item, query: string, itemToStringLabel: (item: Item) => string) => boolean) | null
  disabled?: boolean
  /** Keyboard highlighting on web; accepted for API parity. */
  autoHighlight?: boolean
}

function Combobox({
  children,
  items,
  multiple = false,
  value: valueProp,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  inputValue: inputValueProp,
  defaultInputValue,
  onInputValueChange,
  itemToStringLabel,
  itemToStringValue,
  isItemEqualToValue,
  filter,
  disabled = false,
  autoHighlight: _autoHighlight,
}: ComboboxProps) {
  const id = React.useId()
  const labelOf = React.useCallback((item: Item) => (itemToStringLabel ?? defaultLabel)(item), [itemToStringLabel])
  const equal = React.useCallback(
    (a: Item, b: Item) => {
      if (a == null || b == null) return false
      if (isItemEqualToValue) return isItemEqualToValue(a, b)
      const keyOf = itemToStringValue ?? defaultKey
      return keyOf(a) === keyOf(b)
    },
    [isItemEqualToValue, itemToStringValue]
  )

  const [value, setValue] = useControllableState<Item>({
    prop: valueProp,
    defaultProp: defaultValue ?? (multiple ? [] : null),
    onChange: onValueChange,
  })
  const values = React.useMemo<Item[]>(
    () => (multiple ? ((value as Item[] | null) ?? []) : value == null ? [] : [value]),
    [multiple, value]
  )
  const selectedLabel = !multiple && value != null ? labelOf(value) : ""

  const [inputValue, setInputValue] = useControllableState<string>({
    prop: inputValueProp,
    defaultProp: defaultInputValue ?? selectedLabel,
    onChange: onInputValueChange,
  })
  const [open, setOpenState] = useControllableState({ prop: openProp, defaultProp: defaultOpen, onChange: onOpenChange })
  const [focused, setFocused] = React.useState(false)

  const inputRef = React.useRef<RNTextInput | null>(null)
  const anchors = React.useRef<Partial<Record<AnchorKind, RNView | null>>>({})

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (disabled && next) return
      setOpenState(next)
      // Like Base UI, closing a single-value combobox puts the selected label back in the input.
      if (!next && !multiple) setInputValue(selectedLabel)
    },
    [disabled, setOpenState, multiple, setInputValue, selectedLabel]
  )

  const isSelected = React.useCallback((item: Item) => values.some((v) => equal(v, item)), [values, equal])

  const select = React.useCallback(
    (item: Item) => {
      if (multiple) {
        setValue(isSelected(item) ? values.filter((v) => !equal(v, item)) : [...values, item])
        setInputValue("")
      } else {
        setValue(item)
        setInputValue(labelOf(item))
        setOpenState(false)
        inputRef.current?.blur()
      }
    },
    [multiple, setValue, isSelected, values, equal, setInputValue, labelOf, setOpenState]
  )
  const remove = React.useCallback(
    (item: Item) => {
      if (multiple) setValue(values.filter((v) => !equal(v, item)))
      else if (equal(value, item)) setValue(null)
    },
    [multiple, setValue, values, equal, value]
  )
  const clear = React.useCallback(() => {
    setValue(multiple ? [] : null)
    setInputValue("")
  }, [setValue, multiple, setInputValue])

  // An input that just shows the selected label doesn't filter the list down to it.
  const query = !multiple && inputValue === selectedLabel ? "" : inputValue

  const matches = React.useCallback(
    (item: Item, label?: string) => {
      if (filter === null || !query) return true
      if (filter) return filter(item, query, labelOf)
      return (label ?? labelOf(item)).toLowerCase().includes(query.trim().toLowerCase())
    },
    [filter, query, labelOf]
  )

  const filteredItems = React.useMemo(() => {
    if (!items) return undefined
    const out: Item[] = []
    for (const item of items) {
      if (isGroup(item)) {
        const groupItems = item.items.filter((i) => matches(i))
        if (groupItems.length) out.push({ ...item, items: groupItems })
      } else if (matches(item)) {
        out.push(item)
      }
    }
    return out
  }, [items, matches])

  const [visible, setVisible] = React.useState<ReadonlyMap<string, string | undefined>>(new Map())
  const registerItem = React.useCallback((itemId: string, group: string | undefined) => {
    setVisible((prev) => {
      if (prev.has(itemId) && prev.get(itemId) === group) return prev
      const next = new Map(prev)
      next.set(itemId, group)
      return next
    })
  }, [])
  const unregisterItem = React.useCallback((itemId: string) => {
    setVisible((prev) => {
      if (!prev.has(itemId)) return prev
      const next = new Map(prev)
      next.delete(itemId)
      return next
    })
  }, [])

  const context = React.useMemo<ComboboxContextValue>(
    () => ({
      id,
      open,
      setOpen,
      inputValue,
      setInputValue,
      multiple,
      disabled,
      value,
      values,
      isSelected,
      select,
      remove,
      clear,
      labelOf,
      matches,
      filteredItems,
      setAnchor: (kind, node) => {
        anchors.current[kind] = node
      },
      getAnchor: () => {
        const kind = (["chips", "input", "trigger"] as const).find((k) => anchors.current[k])
        return { node: kind ? (anchors.current[kind] ?? null) : null, kind }
      },
      inputRef,
      registerItem,
      unregisterItem,
      visibleCount: visible.size,
      isGroupVisible: (group) => {
        for (const g of visible.values()) if (g === group) return true
        return false
      },
      focused,
      setFocused,
    }),
    [
      id,
      open,
      setOpen,
      inputValue,
      setInputValue,
      multiple,
      disabled,
      value,
      values,
      isSelected,
      select,
      remove,
      clear,
      labelOf,
      matches,
      filteredItems,
      registerItem,
      unregisterItem,
      visible,
      focused,
    ]
  )

  return <ComboboxContext.Provider value={context}>{children}</ComboboxContext.Provider>
}

function ComboboxValue({
  children,
  placeholder,
  className,
  ...props
}: Omit<TextProps, "children"> & {
  children?: React.ReactNode | ((value: Item) => React.ReactNode)
  placeholder?: React.ReactNode
}) {
  const { value, values, multiple, labelOf } = useCombobox()
  if (typeof children === "function") return <>{children(value)}</>
  if (children != null) return <>{renderTextChildren(children)}</>
  const text = multiple ? values.map(labelOf).join(", ") : value != null ? labelOf(value) : ""
  return (
    <Text data-slot="combobox-value" numberOfLines={1} className={className} {...props}>
      {text || placeholder}
    </Text>
  )
}

type ComboboxTriggerProps = Omit<React.ComponentProps<typeof Pressable>, "children"> & {
  children?: React.ReactNode
  /** Base UI's `render`: the element to render as, e.g. `render={<Button variant="outline" />}`. */
  render?: React.ReactElement<Record<string, unknown>>
}

function ComboboxTrigger({ className, children, onPress, disabled, ref, render, ...props }: ComboboxTriggerProps) {
  const ctx = useCombobox()
  const inContent = React.useContext(ComboboxInContentContext)
  const anchorRef = React.useCallback(
    (node: RNView | null) => {
      if (!inContent) ctx.setAnchor("trigger", node)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inContent]
  )
  const isDisabled = !!disabled || ctx.disabled
  const icon = (
    <Icon
      key="combobox-trigger-icon"
      as={ChevronDownIcon}
      data-slot="combobox-trigger-icon"
      className="pointer-events-none size-4 text-muted-foreground"
    />
  )
  const toggle = (e: GestureResponderEvent) => {
    onPress?.(e)
    ctx.setOpen(!ctx.open)
  }
  if (render) {
    return React.cloneElement(render, {
      ...props,
      ref: composeRefs(anchorRef, ref as React.Ref<RNView>, render.props.ref as React.Ref<RNView> | undefined),
      "data-slot": "combobox-trigger",
      "data-pressed": ctx.open || undefined,
      "aria-haspopup": "listbox",
      "aria-expanded": ctx.open,
      disabled: isDisabled || (render.props.disabled as boolean | undefined),
      className: cn("[&_svg:not([class*='size-'])]:size-4", render.props.className as string | undefined, className),
      onPress: toggle,
      children: [
        <React.Fragment key="children">{(render.props.children as React.ReactNode) ?? children}</React.Fragment>,
        icon,
      ],
    })
  }
  return (
    <Pressable
      ref={composeRefs(anchorRef, ref as React.Ref<RNView>) as never}
      data-slot="combobox-trigger"
      // Base UI marks the trigger pressed while the popup is open.
      data-pressed={ctx.open || undefined}
      role="button"
      aria-haspopup="listbox"
      aria-expanded={ctx.open}
      aria-disabled={isDisabled || undefined}
      disabled={isDisabled}
      // `flex-row items-center`: a web button lays its label and icon out inline.
      className={cn("flex-row items-center [&_svg:not([class*='size-'])]:size-4", className)}
      onPress={toggle}
      {...props}
    >
      {renderTextChildren(children)}
      {icon}
    </Pressable>
  )
}

function ComboboxClear({ className, disabled, onPress, ...props }: React.ComponentProps<typeof InputGroupButton>) {
  const ctx = useCombobox()
  return (
    <InputGroupButton
      data-slot="combobox-clear"
      variant="ghost"
      size="icon-xs"
      aria-label="Clear"
      disabled={disabled ?? ctx.disabled}
      className={cn(className)}
      onPress={(e) => {
        onPress?.(e)
        ctx.clear()
        ctx.inputRef.current?.focus()
      }}
      {...props}
    >
      <Icon as={XIcon} className="pointer-events-none" />
    </InputGroupButton>
  )
}

type ComboboxInputProps = Omit<React.ComponentProps<typeof InputGroupInput>, "value" | "defaultValue"> & {
  children?: React.ReactNode
  disabled?: boolean
  showTrigger?: boolean
  showClear?: boolean
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  onChangeText,
  onFocus,
  onBlur,
  ref,
  ...props
}: ComboboxInputProps) {
  const ctx = useCombobox()
  const inContent = React.useContext(ComboboxInContentContext)
  const isDisabled = disabled || ctx.disabled
  // Base UI only renders the clear button when there is something to clear.
  const clearVisible = showClear && (ctx.values.length > 0 || ctx.inputValue.length > 0)
  return (
    <InputGroup
      ref={(node: RNView | null) => {
        if (!inContent) ctx.setAnchor("input", node)
      }}
      className={cn(
        "w-auto",
        // Inside the popup: `*:data-[slot=input-group]:m-1 mb-0 h-8 border-input/30 bg-input/30 shadow-none` from ComboboxContent.
        inContent && "m-1 mb-0 h-8 border-input/30 bg-input/30 shadow-none",
        className
      )}
    >
      <InputGroupInput
        ref={composeRefs(inContent ? undefined : ctx.inputRef, ref as React.Ref<RNTextInput>) as never}
        role="combobox"
        aria-expanded={ctx.open}
        aria-autocomplete="list"
        editable={!isDisabled}
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={inContent}
        value={ctx.inputValue}
        onChangeText={(text) => {
          ctx.setInputValue(text)
          if (!ctx.open) ctx.setOpen(true)
          onChangeText?.(text)
        }}
        onFocus={(e) => {
          if (!inContent && !ctx.open) ctx.setOpen(true)
          onFocus?.(e)
        }}
        onBlur={onBlur}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {/* `group-has-data-[slot=combobox-clear]/input-group:hidden`: the trigger is left out while the clear button shows. */}
        {showTrigger && !clearVisible && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            asChild
            data-slot="input-group-button"
            className="data-pressed:bg-transparent"
            disabled={isDisabled}
          >
            <ComboboxTrigger aria-label="Open" />
          </InputGroupButton>
        )}
        {clearVisible && <ComboboxClear disabled={isDisabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  )
}

function useAnchorRect(open: boolean, getAnchor: () => RNView | null) {
  const [rect, setRect] = React.useState<Rect | null>(null)
  const [keyboardTop, setKeyboardTop] = React.useState<number | null>(null)
  const measure = React.useCallback(() => {
    getAnchor()?.measure((_x, _y, width, height, pageX, pageY) => setRect({ x: pageX, y: pageY, width, height }))
  }, [getAnchor])
  React.useEffect(() => {
    if (!open) return
    measure()
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardTop(e.endCoordinates.screenY)
      measure()
    })
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardTop(null)
      measure()
    })
    return () => {
      show.remove()
      hide.remove()
    }
  }, [open, measure])
  return { rect, keyboardTop }
}

const SPACING = 4
/** `max-h-96`. */
const MAX_HEIGHT = 96 * SPACING

type ComboboxContentProps = ViewProps & {
  side?: "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end"
  align?: "start" | "center" | "end"
  sideOffset?: number
  alignOffset?: number
  /** The element to position against, e.g. ComboboxChips with `useComboboxAnchor()`. */
  anchor?: React.RefObject<RNView | null>
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  children,
  style,
  ...props
}: ComboboxContentProps) {
  const ctx = useCombobox()
  const insets = useInsets()
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const anchorKind = anchor ? "chips" : ctx.getAnchor().kind
  const getAnchor = React.useCallback(() => anchor?.current ?? ctx.getAnchor().node, [anchor, ctx])
  const { rect, keyboardTop } = useAnchorRect(ctx.open, getAnchor)
  const [contentHeight, setContentHeight] = React.useState(0)

  if (!ctx.open) return null
  // Until the anchor is measured the popup renders hidden, so its items (and the empty state) are ready.
  const measured = rect !== null
  const r = rect ?? { x: 0, y: 0, width: 0, height: 0 }

  // `side`: above or below the anchor (`left`/`right` fall back to `bottom`), flipping when there's no room.
  const margin = 8
  const bottomLimit = (keyboardTop ?? windowHeight - insets.bottom) - margin
  const spaceBelow = bottomLimit - (r.y + r.height + sideOffset)
  const spaceAbove = r.y - sideOffset - margin - insets.top
  const needed = Math.min(contentHeight || 200, MAX_HEIGHT)
  const placeTop =
    side === "top" ? spaceAbove >= needed || spaceAbove > spaceBelow : spaceBelow < needed && spaceAbove > spaceBelow
  const available = Math.max(80, placeTop ? spaceAbove : spaceBelow)

  // `w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))]`
  // and `data-[chips=true]:min-w-(--anchor-width)`. The input's anchor here is its whole group (on web
  // it's the input, 7 spacing narrower than the group), so the popup matches the group's width.
  const maxWidth = windowWidth - margin * 2
  const width = Math.min(anchorKind === "trigger" ? r.width + 7 * SPACING : r.width, maxWidth)
  let left = align === "end" ? r.x + r.width - width : align === "center" ? r.x + (r.width - width) / 2 : r.x
  left = Math.max(margin, Math.min(left + alignOffset, windowWidth - width - margin))
  const position = placeTop ? { bottom: windowHeight - r.y + sideOffset } : { top: r.y + r.height + sideOffset }
  const vside = placeTop ? "top" : "bottom"
  const maxHeight = Math.min(available, MAX_HEIGHT)

  return (
    <Portal name={`${ctx.id}_combobox`}>
      <ComboboxContext.Provider value={ctx}>
        <ComboboxInContentContext.Provider value>
          <ComboboxListHeightContext.Provider value={maxHeight}>
            {/* Pressing outside closes the popup. */}
            <RNPressable
              accessible={false}
              style={StyleSheet.absoluteFill}
              onPress={() => {
                ctx.setOpen(false)
                ctx.inputRef.current?.blur()
              }}
            >
              {/* The positioner: `isolate z-50`. */}
              <RNView
                style={[styles.positioner, position, { left, width, maxWidth, opacity: measured ? 1 : 0, pointerEvents: measured ? "auto" : "none" }]}
                onStartShouldSetResponder={() => true}
                onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
              >
                {/* `data-open:animate-in fade-in-0 zoom-in-95 data-[side=*]:slide-in-from-*-2`; no exit animation. */}
                <SidePopupAnimation key={measured ? "measured" : "hidden"} side={vside}>
                  <View
                    data-slot="combobox-content"
                    data-chips={!!anchor}
                    data-side={vside}
                    data-open
                    data-empty={ctx.visibleCount === 0 || undefined}
                    role="list"
                    // `origin-(--transform-origin)` and the `*:data-[slot=input-group]:*` classes (applied by ComboboxInput) are left out.
                    className={cn(
                      "group/combobox-content relative max-h-96 w-full overflow-hidden rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10",
                      className
                    )}
                    style={[{ maxHeight }, style]}
                    {...props}
                  >
                    {children}
                  </View>
                </SidePopupAnimation>
              </RNView>
            </RNPressable>
          </ComboboxListHeightContext.Provider>
        </ComboboxInContentContext.Provider>
      </ComboboxContext.Provider>
    </Portal>
  )
}

const styles = StyleSheet.create({ positioner: { position: "absolute" } })

function ComboboxList({
  className,
  children,
  style,
  ...props
}: Omit<React.ComponentProps<typeof ScrollView>, "children"> & {
  children?: React.ReactNode | ((item: Item, index: number) => React.ReactNode)
}) {
  const ctx = useCombobox()
  const available = React.useContext(ComboboxListHeightContext)
  const empty = ctx.visibleCount === 0
  return (
    <ScrollView
      data-slot="combobox-list"
      data-empty={empty || undefined}
      keyboardShouldPersistTaps="always"
      // `max-h-[min(calc(--spacing(96)---spacing(9)),calc(var(--available-height)---spacing(9)))]` as a style;
      // `grow-0`: a ScrollView grows to fill its parent on native.
      className={cn("grow-0 scroll-py-1 overflow-y-auto p-1 data-empty:p-0", className)}
      style={[available !== undefined ? { maxHeight: Math.min(MAX_HEIGHT, available) - 9 * SPACING } : null, style]}
      {...props}
    >
      {typeof children === "function"
        ? (ctx.filteredItems ?? []).map((item, index) => (
            <React.Fragment key={String(isGroup(item) ? (item.value ?? index) : (defaultKey(item) ?? index))}>
              {children(item, index)}
            </React.Fragment>
          ))
        : children}
    </ScrollView>
  )
}

type ComboboxItemProps = Omit<React.ComponentProps<typeof Pressable>, "children"> & {
  children?: React.ReactNode
  value: Item
}

function ComboboxItem({
  className,
  children,
  value,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  ...props
}: ComboboxItemProps) {
  const ctx = useCombobox()
  const group = React.useContext(ComboboxGroupContext)
  const id = React.useId()
  const label = textOf(children) || ctx.labelOf(value)
  // With `items`, match the item's label as the root does; otherwise the rendered text.
  const visible = ctx.filteredItems ? ctx.matches(value) : ctx.matches(value, label)
  const selected = ctx.isSelected(value)
  const [highlighted, setHighlighted] = React.useState(false)
  const { registerItem, unregisterItem } = ctx

  React.useLayoutEffect(() => {
    if (!visible) return
    registerItem(id, group?.id)
    return () => unregisterItem(id)
  }, [visible, id, group?.id, registerItem, unregisterItem])

  if (!visible) return null
  return (
    <Pressable
      data-slot="combobox-item"
      // Base UI highlights on pointer and keyboard; here on press and hover.
      data-highlighted={highlighted || undefined}
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      onPressIn={(e: GestureResponderEvent) => {
        setHighlighted(true)
        onPressIn?.(e)
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setHighlighted(false)
        onPressOut?.(e)
      }}
      onHoverIn={(e) => {
        setHighlighted(true)
        onHoverIn?.(e)
      }}
      onHoverOut={(e) => {
        setHighlighted(false)
        onHoverOut?.(e)
      }}
      onPress={(e: GestureResponderEvent) => {
        onPress?.(e)
        ctx.select(value)
      }}
      {...props}
    >
      {renderTextChildren(children ?? ctx.labelOf(value))}
      {selected && (
        <View
          data-slot="combobox-item-indicator"
          className="pointer-events-none absolute right-2 flex size-4 items-center justify-center"
        >
          <Icon as={CheckIcon} className="pointer-events-none size-4 pointer-coarse:size-5" />
        </View>
      )}
    </Pressable>
  )
}

function ComboboxGroup({ className, items, ...props }: ViewProps & { items?: Item[] }) {
  const id = React.useId()
  const { isGroupVisible } = useCombobox()
  const value = React.useMemo(() => ({ id, items }), [id, items])
  return (
    <ComboboxGroupContext.Provider value={value}>
      <View
        data-slot="combobox-group"
        role="group"
        // Groups with no matching items are hidden.
        className={cn(!isGroupVisible(id) && "hidden", className)}
        {...props}
      />
    </ComboboxGroupContext.Provider>
  )
}

function ComboboxLabel({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="combobox-label"
      className={cn(
        "px-2 py-1.5 text-xs text-muted-foreground pointer-coarse:px-3 pointer-coarse:py-2 pointer-coarse:text-sm",
        className
      )}
      {...props}
    />
  )
}

/** Renders the enclosing ComboboxGroup's `items`. */
function ComboboxCollection({ children }: { children: (item: Item, index: number) => React.ReactNode }) {
  const group = React.useContext(ComboboxGroupContext)
  return (
    <>
      {(group?.items ?? []).map((item, index) => (
        <React.Fragment key={String(defaultKey(item) ?? index)}>{children(item, index)}</React.Fragment>
      ))}
    </>
  )
}

function ComboboxEmpty({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="combobox-empty"
      role="status"
      className={cn(
        "hidden w-full justify-center py-2 text-center text-sm text-muted-foreground group-data-empty/combobox-content:flex",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

function ComboboxSeparator({ className, ...props }: ViewProps) {
  return (
    <View data-slot="combobox-separator" role="separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
  )
}

function ComboboxChips({
  className,
  ref,
  onPress,
  ...props
}: Omit<React.ComponentProps<typeof Pressable>, "ref"> & { ref?: React.Ref<RNView | null> }) {
  const ctx = useCombobox()
  return (
    <Pressable
      ref={composeRefs<RNView>((node) => ctx.setAnchor("chips", node), ref as React.Ref<RNView>) as never}
      data-slot="combobox-chips"
      accessible={false}
      className={cn(
        // `focus-within:*` follows the chips input's focus, and `has-data-[slot=combobox-chip]:px-1.5` the selected values.
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent bg-clip-padding px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow] has-aria-invalid:border-destructive has-aria-invalid:ring-[3px] has-aria-invalid:ring-destructive/20 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
        ctx.focused && "border-ring ring-[3px] ring-ring/50",
        ctx.values.length > 0 && "px-1.5",
        className
      )}
      // Pressing the chips' empty space focuses the input.
      onPress={(e: GestureResponderEvent) => {
        onPress?.(e)
        ctx.inputRef.current?.focus()
      }}
      {...props}
    />
  )
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  value,
  ...props
}: ViewProps & {
  showRemove?: boolean
  /** The selected item the chip shows; by default the one whose label is the chip's text. */
  value?: Item
}) {
  const ctx = useCombobox()
  const item = value !== undefined ? value : ctx.values.find((v) => ctx.labelOf(v) === textOf(children))
  return (
    <View
      data-slot="combobox-chip"
      className={cn(
        "flex h-[calc(--spacing(5.5))] w-fit items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50",
        // `has-data-[slot=combobox-chip-remove]:pr-0`
        showRemove && "pr-0",
        className
      )}
      {...props}
    >
      {renderTextChildren(children, undefined, { numberOfLines: 1 })}
      {showRemove && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Remove"
          disabled={ctx.disabled}
          className="-ml-1 opacity-50 hover:opacity-100 active:opacity-100"
          data-slot="combobox-chip-remove"
          onPress={() => item !== undefined && ctx.remove(item)}
        >
          <Icon as={XIcon} className="pointer-events-none" />
        </Button>
      )}
    </View>
  )
}

function ComboboxChipsInput({
  className,
  onChangeText,
  onFocus,
  onBlur,
  onKeyPress,
  ref,
  ...props
}: React.ComponentProps<typeof TextInput>) {
  const ctx = useCombobox()
  return (
    <TextInput
      ref={composeRefs(ctx.inputRef, ref as React.Ref<RNTextInput>) as never}
      data-slot="combobox-chip-input"
      role="combobox"
      aria-expanded={ctx.open}
      editable={!ctx.disabled}
      autoCorrect={false}
      autoCapitalize="none"
      value={ctx.inputValue}
      onChangeText={(text) => {
        ctx.setInputValue(text)
        if (!ctx.open) ctx.setOpen(true)
        onChangeText?.(text)
      }}
      onFocus={(e) => {
        ctx.setFocused(true)
        if (!ctx.open) ctx.setOpen(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        ctx.setFocused(false)
        onBlur?.(e)
      }}
      onKeyPress={(e) => {
        // Backspace in an empty input removes the last chip.
        if (e.nativeEvent.key === "Backspace" && ctx.inputValue === "" && ctx.values.length) {
          ctx.remove(ctx.values[ctx.values.length - 1])
        }
        onKeyPress?.(e)
      }}
      className={cn("min-w-16 flex-1 outline-none", className)}
      {...props}
    />
  )
}

/** A ref for ComboboxChips, to pass to ComboboxContent's `anchor`. */
function useComboboxAnchor() {
  return React.useRef<RNView | null>(null)
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
  type ComboboxProps,
  type ComboboxContentProps,
  type ComboboxInputProps,
  type ComboboxItemProps,
  type ComboboxTriggerProps,
}
