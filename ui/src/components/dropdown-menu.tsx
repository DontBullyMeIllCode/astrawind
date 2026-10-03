import * as React from "react"
import { Platform, StyleSheet } from "react-native"
import * as DropdownMenuPrimitive from "@rn-primitives/dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react-native"
import { ScrollView, styled, Text, View } from "@astrawind/css"
import { Icon } from "./icon"
import { renderTextChildren } from "../lib/children"
import {
  InsideMenuContentContext,
  MenuPopupAnimation,
  ROOT_CONTENTS_STYLE,
  useAvailableHeight,
  useCollisionInsets,
  type CollisionPadding,
  type MenuSide,
} from "../lib/menu"
import { composeRefs, OpenSync, useControllableState, verticalSide, withHighlight, type Align } from "../lib/overlay"
import { cn } from "../lib/utils"

type WithClassName<P> = Omit<P, "children"> & { className?: string; children?: React.ReactNode }
type ViewProps = React.ComponentProps<typeof View>
type TextProps = React.ComponentProps<typeof Text>

const StyledTrigger = styled(DropdownMenuPrimitive.Trigger, { interactive: true }) as React.ComponentType<
  WithClassName<DropdownMenuPrimitive.TriggerProps> & { ref?: React.Ref<DropdownMenuPrimitive.TriggerRef> }
>
const StyledItem = styled(withHighlight(DropdownMenuPrimitive.Item), { interactive: true }) as React.ComponentType<
  WithClassName<DropdownMenuPrimitive.ItemProps>
>
const StyledCheckboxItem = styled(withHighlight(DropdownMenuPrimitive.CheckboxItem), {
  interactive: true,
}) as React.ComponentType<WithClassName<DropdownMenuPrimitive.CheckboxItemProps>>
const StyledRadioItem = styled(withHighlight(DropdownMenuPrimitive.RadioItem), {
  interactive: true,
}) as React.ComponentType<WithClassName<DropdownMenuPrimitive.RadioItemProps>>
const StyledSubTrigger = styled(withHighlight(DropdownMenuPrimitive.SubTrigger), {
  interactive: true,
}) as React.ComponentType<WithClassName<DropdownMenuPrimitive.SubTriggerProps>>
const StyledSubContent = styled(DropdownMenuPrimitive.SubContent) as React.ComponentType<
  WithClassName<DropdownMenuPrimitive.SubContentProps>
>
const StyledGroup = styled(DropdownMenuPrimitive.Group) as React.ComponentType<WithClassName<DropdownMenuPrimitive.GroupProps>>
const StyledLabel = styled(DropdownMenuPrimitive.Label, { kind: "text" }) as React.ComponentType<
  WithClassName<DropdownMenuPrimitive.LabelProps>
>
const StyledSeparator = styled(DropdownMenuPrimitive.Separator) as React.ComponentType<
  WithClassName<DropdownMenuPrimitive.SeparatorProps>
>

const TriggerRefContext = React.createContext<React.RefObject<DropdownMenuPrimitive.TriggerRef | null> | null>(null)

type DropdownMenuProps = Omit<DropdownMenuPrimitive.RootProps, "asChild"> & {
  open?: boolean
  defaultOpen?: boolean
}

function DropdownMenu({ open, defaultOpen, onOpenChange, children, ...props }: DropdownMenuProps) {
  const triggerRef = React.useRef<DropdownMenuPrimitive.TriggerRef | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <DropdownMenuPrimitive.Root
      data-slot="dropdown-menu"
      style={ROOT_CONTENTS_STYLE}
      onOpenChange={(next) => {
        setIsOpen(next)
        onOpenChange?.(next)
      }}
      {...props}
    >
      <TriggerRefContext.Provider value={triggerRef}>{children}</TriggerRefContext.Provider>
      <OpenSync open={open} defaultOpen={defaultOpen} isOpen={isOpen} triggerRef={triggerRef} />
    </DropdownMenuPrimitive.Root>
  )
}

function DropdownMenuPortal({ children, ...props }: DropdownMenuPrimitive.PortalProps) {
  // Inside the content (around a sub-menu), sub-menus render inline on native.
  const inside = React.useContext(InsideMenuContentContext)
  if (inside) return <>{children}</>
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props}>
      {children}
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuTrigger({
  ref,
  asChild,
  children,
  ...props
}: WithClassName<DropdownMenuPrimitive.TriggerProps> & { ref?: React.Ref<DropdownMenuPrimitive.TriggerRef> }) {
  const triggerRef = React.useContext(TriggerRefContext)
  const { open } = DropdownMenuPrimitive.useRootContext()
  return (
    <StyledTrigger
      ref={composeRefs(triggerRef ?? undefined, ref)}
      data-slot="dropdown-menu-trigger"
      data-state={open ? "open" : "closed"}
      aria-expanded={open}
      aria-haspopup="menu"
      asChild={asChild}
      {...props}
    >
      {asChild ? children : renderTextChildren(children)}
    </StyledTrigger>
  )
}

type DropdownMenuContentProps = ViewProps & {
  /** `left`/`right` open below on native: rn-primitives positions above or below the trigger. */
  side?: MenuSide
  align?: Align
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?: CollisionPadding
}

function DropdownMenuContent({
  className,
  side = "bottom",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  avoidCollisions = true,
  collisionPadding,
  style,
  children,
  ...props
}: DropdownMenuContentProps) {
  const { triggerPosition } = DropdownMenuPrimitive.useRootContext() as { triggerPosition?: { pageY: number; height: number } | null }
  const insets = useCollisionInsets(collisionPadding)
  const maxHeight = useAvailableHeight(triggerPosition, sideOffset, insets)
  const vside = verticalSide(side)
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Overlay style={Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined}>
        <DropdownMenuPrimitive.Content
          side={vside}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          insets={insets}
        >
          <MenuPopupAnimation side={vside}>
            <View
              data-slot="dropdown-menu-content"
              data-side={vside}
              data-state="open"
              role="menu"
              className={cn(
                // `max-h-(--radix-*-available-height)` is the `maxHeight` style; `origin-*` and the
                // `animate-in`/`fade-*`/`zoom-*`/`slide-in-*` classes are MenuPopupAnimation.
                "z-50 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
                className
              )}
              style={[{ maxHeight }, style]}
              {...props}
            >
              <InsideMenuContentContext.Provider value={true}>
                <ScrollView bounces={false} className="grow-0">
                  {children}
                </ScrollView>
              </InsideMenuContentContext.Provider>
            </View>
          </MenuPopupAnimation>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Overlay>
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup(props: WithClassName<DropdownMenuPrimitive.GroupProps>) {
  return <StyledGroup data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuItem({
  className,
  asChild,
  inset,
  variant = "default",
  disabled,
  children,
  ...props
}: WithClassName<DropdownMenuPrimitive.ItemProps> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <StyledItem
      asChild={asChild}
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      data-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(
        // `[&_svg:not([class*='text-'])]:` → `[&_svg]:` (the default icon color, which an icon's own `text-*` overrides),
        // and `data-[variant=destructive]:*:[svg]:text-destructive!` → `data-[variant=destructive]:[&_svg]:text-destructive`.
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-muted-foreground data-[variant=destructive]:[&_svg]:text-destructive",
        className
      )}
      {...props}
    >
      {asChild ? children : renderTextChildren(children)}
    </StyledItem>
  )
}

type CheckboxItemProps = WithClassName<Omit<DropdownMenuPrimitive.CheckboxItemProps, "checked" | "onCheckedChange">> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked: checkedProp,
  onCheckedChange,
  disabled,
  ...props
}: CheckboxItemProps) {
  const [checked, setChecked] = useControllableState({ prop: checkedProp, defaultProp: false, onChange: onCheckedChange })
  return (
    <StyledCheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-state={checked ? "checked" : "unchecked"}
      data-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      onCheckedChange={setChecked}
      {...props}
    >
      <View className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Icon as={CheckIcon} className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </View>
      {renderTextChildren(children)}
    </StyledCheckboxItem>
  )
}

type RadioGroupProps = Omit<DropdownMenuPrimitive.RadioGroupProps, "value" | "onValueChange"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

function DropdownMenuRadioGroup({ value: valueProp, defaultValue, onValueChange, ...props }: RadioGroupProps) {
  const [value, setValue] = useControllableState<string | undefined>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange as (value: string | undefined) => void,
  })
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      value={value}
      onValueChange={setValue}
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  disabled,
  ...props
}: WithClassName<DropdownMenuPrimitive.RadioItemProps>) {
  return (
    <StyledRadioItem
      data-slot="dropdown-menu-radio-item"
      data-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <View className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Icon as={CircleIcon} className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </View>
      {renderTextChildren(children)}
    </StyledRadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: WithClassName<DropdownMenuPrimitive.LabelProps> & {
  inset?: boolean
}) {
  return (
    <StyledLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: WithClassName<DropdownMenuPrimitive.SeparatorProps>) {
  return (
    <StyledSeparator data-slot="dropdown-menu-separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
  )
}

function DropdownMenuShortcut({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="dropdown-menu-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}

function DropdownMenuSub(props: DropdownMenuPrimitive.SubProps) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  disabled,
  ...props
}: WithClassName<DropdownMenuPrimitive.SubTriggerProps> & {
  inset?: boolean
}) {
  const { open } = DropdownMenuPrimitive.useSubContext()
  return (
    <StyledSubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      data-state={open ? "open" : "closed"}
      data-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(
        // `[&_svg:not([class*='text-'])]:` → `[&_svg]:` (the default icon color).
        "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[inset]:pl-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
      {/* The sub-menu opens inline below its trigger on native, so the chevron turns down. */}
      <Icon as={ChevronRightIcon} className={cn("ml-auto size-4", open && Platform.OS !== "web" && "rotate-90")} />
    </StyledSubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  side: _side,
  sideOffset: _sideOffset,
  align: _align,
  alignOffset: _alignOffset,
  ...props
}: WithClassName<DropdownMenuPrimitive.SubContentProps> & {
  side?: MenuSide
  sideOffset?: number
  align?: Align
  alignOffset?: number
}) {
  // Native sub-menus render inline under their trigger (positioning props are accepted for parity).
  const { open } = DropdownMenuPrimitive.useSubContext()
  if (!open && !props.forceMount) return null
  return (
    <MenuPopupAnimation side="bottom" distance={4}>
      <StyledSubContent
        data-slot="dropdown-menu-sub-content"
        data-side="bottom"
        data-state={open ? "open" : "closed"}
        className={cn(
          // `origin-*` and the enter/exit animation classes are MenuPopupAnimation.
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
          className
        )}
        {...props}
      />
    </MenuPopupAnimation>
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
