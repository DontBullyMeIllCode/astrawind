import * as React from "react"
import type { TextInput as RNTextInput, TextInputProps } from "react-native"
import { cva, type VariantProps } from "class-variance-authority"
import { Pressable, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { useFieldControl } from "../lib/field-control"
import { composeRefs } from "../lib/overlay"
import { cn, hasClass } from "../lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Textarea } from "./textarea"

type Align = "inline-start" | "inline-end" | "block-start" | "block-end"
type ChildProps = Record<string, unknown> & { children?: React.ReactNode; className?: string }

/**
 * The group's `has-[…]` selectors look at its controls and addons, which set their
 * `data-slot`/`data-align` themselves (so `has-*` can't see them in JSX). The group
 * works them out from its children and shares them, with the control's focus, here.
 */
interface InputGroupContextValue {
  setFocused: (focused: boolean) => void
  focusControl: () => void
  registerControl: (input: RNTextInput | null) => void
  aligns: Record<Align, boolean>
  hasInput: boolean
  block: boolean
}

const InputGroupContext = React.createContext<InputGroupContextValue | null>(null)

function elementsOf(children: React.ReactNode) {
  return React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<ChildProps>[]
}

const typeName = (el: React.ReactElement) => {
  const t = el.type as { displayName?: string; name?: string } | string
  return typeof t === "string" ? t : (t.displayName ?? t.name ?? "")
}

function alignOf(el: React.ReactElement<ChildProps>): Align | undefined {
  if (el.type !== InputGroupAddon && el.props["data-slot"] !== "input-group-addon") return undefined
  return (el.props.align as Align | undefined) ?? "inline-start"
}

/** Whether any JSX descendant is marked `aria-invalid`. */
function hasInvalid(children: React.ReactNode, depth = 0): boolean {
  return elementsOf(children).some((el) => {
    const v = el.props["aria-invalid"]
    if (v === true || v === "true") return true
    return depth < 6 && hasInvalid(el.props.children, depth + 1)
  })
}

function InputGroup({ className, children, ...props }: React.ComponentProps<typeof View>) {
  const [focused, setFocused] = React.useState(false)
  const control = React.useRef<RNTextInput | null>(null)

  const elements = elementsOf(children)
  const aligns: Record<Align, boolean> = {
    "inline-start": false,
    "inline-end": false,
    "block-start": false,
    "block-end": false,
  }
  let hasTextarea = false
  let hasInput = false
  for (const el of elements) {
    const align = alignOf(el)
    if (align) aligns[align] = true
    if (el.type === InputGroupTextarea || el.type === Textarea) hasTextarea = true
    if (el.type === InputGroupInput || el.type === Input) hasInput = true
  }
  const block = aligns["block-start"] || aligns["block-end"]
  const invalid = hasInvalid(children)

  // `order-first` / `order-last` have no native effect: addons are placed here instead.
  const rank = (child: React.ReactNode) => {
    if (!React.isValidElement(child)) return 1
    const a = alignOf(child as React.ReactElement<ChildProps>)
    return a === "inline-start" || a === "block-start" ? 0 : a === "inline-end" || a === "block-end" ? 2 : 1
  }
  const ordered = React.Children.toArray(children)
    .map((child, i) => ({ child, i, r: rank(child) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.child)

  const focusControl = React.useCallback(() => control.current?.focus(), [])
  const registerControl = React.useCallback((input: RNTextInput | null) => {
    control.current = input
  }, [])
  const ctx = React.useMemo<InputGroupContextValue>(
    () => ({ setFocused, focusControl, registerControl, aligns, hasInput, block }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusControl, registerControl, hasInput, block, aligns["inline-start"], aligns["inline-end"], aligns["block-start"], aligns["block-end"]]
  )

  useFieldControl({ focus: focusControl })

  return (
    <InputGroupContext.Provider value={ctx}>
      <View
        data-slot="input-group"
        role="group"
        className={cn(
          "group/input-group relative flex w-full items-center rounded-md border border-input shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30",
          "h-9 min-w-0",
          // `has-[>textarea]:h-auto`
          hasTextarea && "h-auto",

          // Variants based on alignment: `has-[>[data-align=block-*]]:h-auto flex-col`.
          block && "h-auto flex-col",

          // Focus state: `has-[[data-slot=input-group-control]:focus-visible]:*`.
          focused && "border-ring ring-[3px] ring-ring/50",

          // Error state: `has-[[data-slot][aria-invalid=true]]:*`.
          invalid && "border-destructive ring-destructive/20 dark:ring-destructive/40",

          className
        )}
        {...props}
      >
        {ordered}
      </View>
    </InputGroupContext.Provider>
  )
}

// `[&>kbd]:rounded-[calc(var(--radius)-5px)]` is left out: a Kbd sets its own radius.
const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-3",
        "inline-end": "order-last pr-3",
        "block-start": "order-first w-full justify-start px-3 pt-3",
        "block-end": "order-last w-full justify-start px-3 pb-3",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

/** `has-[>button]`, `has-[>kbd]`, `group-has-[>input]/input-group` and `[.border-*]` for an addon. */
function addonExtra(align: Align, children: React.ReactNode, className: string | undefined, hasInput: boolean) {
  const elements = elementsOf(children)
  const button = elements.some((el) => el.type === InputGroupButton || el.type === Button || el.props.role === "button")
  const kbd = elements.some((el) => el.props["data-slot"] === "kbd" || /^Kbd(Group)?$/.test(typeName(el)))
  switch (align) {
    case "inline-start":
      return cn(button && "ml-[-0.45rem]", kbd && "ml-[-0.35rem]")
    case "inline-end":
      return cn(button && "mr-[-0.45rem]", kbd && "mr-[-0.35rem]")
    case "block-start":
      return cn(hasInput && "pt-2.5", hasClass(className, "border-b") && "pb-3")
    case "block-end":
      return cn(hasInput && "pb-2.5", hasClass(className, "border-t") && "pt-3")
  }
}

type InputGroupAddonProps = Omit<React.ComponentProps<typeof Pressable>, "children"> &
  VariantProps<typeof inputGroupAddonVariants> & { children?: React.ReactNode }

function InputGroupAddon({ className, align = "inline-start", children, onPress, ...props }: InputGroupAddonProps) {
  const ctx = React.useContext(InputGroupContext)
  const a = align ?? "inline-start"
  return (
    <Pressable
      role="group"
      data-slot="input-group-addon"
      data-align={a}
      accessible={false}
      // Pressing the addon focuses the input; buttons inside handle their own presses.
      onPress={(e) => {
        onPress?.(e)
        ctx?.focusControl()
      }}
      className={cn(inputGroupAddonVariants({ align: a }), addonExtra(a, children, className, !!ctx?.hasInput), className)}
      {...props}
    >
      {renderTextChildren(children)}
    </Pressable>
  )
}

const inputGroupButtonVariants = cva("flex items-center gap-2 text-sm shadow-none", {
  variants: {
    size: {
      xs: "h-6 gap-1 rounded-[calc(var(--radius)-5px)] px-2 has-[>svg]:px-2 [&>svg:not([class*='size-'])]:size-3.5",
      sm: "h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5",
      "icon-xs": "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0",
      "icon-sm": "size-8 p-0 has-[>svg]:p-0",
    },
  },
  defaultVariants: {
    size: "xs",
  },
})

function InputGroupButton({
  className,
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> & VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button data-size={size} variant={variant} className={cn(inputGroupButtonVariants({ size }), className)} {...props} />
  )
}

function InputGroupText({ className, children, ...props }: React.ComponentProps<typeof View>) {
  return (
    <View
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

/** Tracks the control's focus and ref for its group. */
function useGroupControl(
  ref: React.Ref<RNTextInput> | undefined,
  onFocus: TextInputProps["onFocus"],
  onBlur: TextInputProps["onBlur"]
) {
  const ctx = React.useContext(InputGroupContext)
  const onFocusControl: TextInputProps["onFocus"] = (e) => {
    ctx?.setFocused(true)
    onFocus?.(e)
  }
  const onBlurControl: TextInputProps["onBlur"] = (e) => {
    ctx?.setFocused(false)
    onBlur?.(e)
  }
  return { ctx, ref: composeRefs<RNTextInput>(ref, ctx?.registerControl), onFocus: onFocusControl, onBlur: onBlurControl }
}

/** `has-[>[data-align=…]]:[&>input]:p*-*` from the group, and `flex-auto` in a column group. */
function controlExtra(ctx: InputGroupContextValue | null) {
  if (!ctx) return undefined
  return cn(
    ctx.aligns["inline-start"] && "pl-2",
    ctx.aligns["inline-end"] && "pr-2",
    ctx.aligns["block-start"] && "pb-3",
    ctx.aligns["block-end"] && "pt-3",
    // `flex-1` (flex-basis 0) collapses in an auto-height column on native.
    ctx.block && "flex-auto"
  )
}

type InputGroupInputProps = React.ComponentProps<typeof Input>

function InputGroupInput({ className, ref, onFocus, onBlur, ...props }: InputGroupInputProps) {
  const control = useGroupControl(ref as React.Ref<RNTextInput>, onFocus, onBlur)
  return (
    <Input
      data-slot="input-group-control"
      ref={control.ref as never}
      onFocus={control.onFocus}
      onBlur={control.onBlur}
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
        controlExtra(control.ctx),
        className
      )}
      {...props}
    />
  )
}

type InputGroupTextareaProps = React.ComponentProps<typeof Textarea>

function InputGroupTextarea({ className, ref, onFocus, onBlur, ...props }: InputGroupTextareaProps) {
  const control = useGroupControl(ref as React.Ref<RNTextInput>, onFocus, onBlur)
  return (
    <Textarea
      data-slot="input-group-control"
      ref={control.ref as never}
      onFocus={control.onFocus}
      onBlur={control.onBlur}
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent",
        control.ctx?.block && "flex-auto",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
