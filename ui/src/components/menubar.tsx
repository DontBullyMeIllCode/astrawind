import * as React from "react"
import { Platform, StyleSheet } from "react-native"
import * as MenubarPrimitive from "@rn-primitives/menubar"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react-native"
import { styled, Text, View } from "@astrawind/css"
import { Icon } from "./icon"
import { renderTextChildren } from "../lib/children"
import {
  InsideMenuContentContext,
  MenuPopupAnimation,
  useCollisionInsets,
  type CollisionPadding,
  type MenuSide,
} from "../lib/menu"
import { useControllableState, verticalSide, withHighlight, type Align } from "../lib/overlay"
import { cn } from "../lib/utils"

type WithClassName<P> = Omit<P, "children"> & { className?: string; children?: React.ReactNode }
type ViewProps = React.ComponentProps<typeof View>
type TextProps = React.ComponentProps<typeof Text>

const StyledRoot = styled(MenubarPrimitive.Root) as React.ComponentType<WithClassName<MenubarPrimitive.RootProps>>
const StyledTrigger = styled(withHighlight(MenubarPrimitive.Trigger), { interactive: true }) as React.ComponentType<
  WithClassName<MenubarPrimitive.TriggerProps>
>
const StyledItem = styled(withHighlight(MenubarPrimitive.Item), { interactive: true }) as React.ComponentType<
  WithClassName<MenubarPrimitive.ItemProps>
>
const StyledCheckboxItem = styled(withHighlight(MenubarPrimitive.CheckboxItem), {
  interactive: true,
}) as React.ComponentType<WithClassName<MenubarPrimitive.CheckboxItemProps>>
const StyledRadioItem = styled(withHighlight(MenubarPrimitive.RadioItem), {
  interactive: true,
}) as React.ComponentType<WithClassName<MenubarPrimitive.RadioItemProps>>
const StyledSubTrigger = styled(withHighlight(MenubarPrimitive.SubTrigger), {
  interactive: true,
}) as React.ComponentType<WithClassName<MenubarPrimitive.SubTriggerProps>>
const StyledSubContent = styled(MenubarPrimitive.SubContent) as React.ComponentType<
  WithClassName<MenubarPrimitive.SubContentProps>
>
const StyledGroup = styled(MenubarPrimitive.Group) as React.ComponentType<WithClassName<MenubarPrimitive.GroupProps>>
const StyledLabel = styled(MenubarPrimitive.Label, { kind: "text" }) as React.ComponentType<
  WithClassName<MenubarPrimitive.LabelProps>
>
const StyledSeparator = styled(MenubarPrimitive.Separator) as React.ComponentType<
  WithClassName<MenubarPrimitive.SeparatorProps>
>

type MenubarProps = WithClassName<Omit<MenubarPrimitive.RootProps, "value" | "onValueChange">> & {
  /** The open menu's value (`undefined` or `""` when none is open). */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

function Menubar({ className, value: valueProp, defaultValue, onValueChange, ...props }: MenubarProps) {
  const [value, setValue] = useControllableState<string | undefined>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: (next) => onValueChange?.(next ?? ""),
  })
  return (
    <StyledRoot
      data-slot="menubar"
      value={value || undefined}
      onValueChange={setValue}
      className={cn("flex h-9 items-center gap-1 rounded-md border bg-background p-1 shadow-xs", className)}
      {...props}
    />
  )
}

function MenubarMenu({
  value,
  ...props
}: Omit<MenubarPrimitive.MenuProps, "value"> & {
  value?: string
}) {
  const id = React.useId()
  return <MenubarPrimitive.Menu data-slot="menubar-menu" value={value ?? id} {...props} />
}

function MenubarGroup(props: WithClassName<MenubarPrimitive.GroupProps>) {
  return <StyledGroup data-slot="menubar-group" {...props} />
}

function MenubarPortal({ children, ...props }: MenubarPrimitive.PortalProps) {
  // Inside the content (around a sub-menu), sub-menus render inline on native.
  const inside = React.useContext(InsideMenuContentContext)
  if (inside) return <>{children}</>
  return (
    <MenubarPrimitive.Portal data-slot="menubar-portal" {...props}>
      {children}
    </MenubarPrimitive.Portal>
  )
}

function MenubarRadioGroup({
  value: valueProp,
  defaultValue,
  onValueChange,
  ...props
}: Omit<MenubarPrimitive.RadioGroupProps, "value" | "onValueChange"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}) {
  const [value, setValue] = useControllableState<string | undefined>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange as (value: string | undefined) => void,
  })
  return <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" value={value} onValueChange={setValue} {...props} />
}

function MenubarTrigger({ className, asChild, children, ...props }: WithClassName<MenubarPrimitive.TriggerProps>) {
  const { value } = MenubarPrimitive.useRootContext()
  const { value: menuValue } = MenubarPrimitive.useMenuContext()
  const open = value !== undefined && value === menuValue
  return (
    <StyledTrigger
      asChild={asChild}
      data-slot="menubar-trigger"
      data-state={open ? "open" : "closed"}
      aria-haspopup="menu"
      className={cn(
        "flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        className
      )}
      {...props}
    >
      {asChild ? children : renderTextChildren(children)}
    </StyledTrigger>
  )
}

function MenubarContent({
  className,
  side = "bottom",
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  avoidCollisions = true,
  collisionPadding,
  children,
  ...props
}: ViewProps & {
  /** `left`/`right` open below on native: rn-primitives positions above or below the trigger. */
  side?: MenuSide
  align?: Align
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?: CollisionPadding
}) {
  const insets = useCollisionInsets(collisionPadding)
  const vside = verticalSide(side)
  return (
    <MenubarPortal>
      <MenubarPrimitive.Overlay style={Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined}>
        <MenubarPrimitive.Content
          side={vside}
          align={align}
          alignOffset={alignOffset}
          sideOffset={sideOffset}
          avoidCollisions={avoidCollisions}
          insets={insets}
        >
          <MenuPopupAnimation side={vside}>
            <View
              data-slot="menubar-content"
              data-side={vside}
              data-state="open"
              role="menu"
              className={cn(
                // `origin-*` and the `animate-in`/`fade-*`/`zoom-*`/`slide-in-*` classes are MenuPopupAnimation.
                "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
                className
              )}
              {...props}
            >
              <InsideMenuContentContext.Provider value={true}>{children}</InsideMenuContentContext.Provider>
            </View>
          </MenuPopupAnimation>
        </MenubarPrimitive.Content>
      </MenubarPrimitive.Overlay>
    </MenubarPortal>
  )
}

function MenubarItem({
  className,
  asChild,
  inset,
  variant = "default",
  disabled,
  children,
  ...props
}: WithClassName<MenubarPrimitive.ItemProps> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <StyledItem
      asChild={asChild}
      data-slot="menubar-item"
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

function MenubarCheckboxItem({
  className,
  children,
  checked: checkedProp,
  onCheckedChange,
  disabled,
  ...props
}: WithClassName<Omit<MenubarPrimitive.CheckboxItemProps, "checked" | "onCheckedChange">> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  const [checked, setChecked] = useControllableState({ prop: checkedProp, defaultProp: false, onChange: onCheckedChange })
  return (
    <StyledCheckboxItem
      data-slot="menubar-checkbox-item"
      data-state={checked ? "checked" : "unchecked"}
      data-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      onCheckedChange={setChecked}
      {...props}
    >
      <View className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <Icon as={CheckIcon} className="size-4" />
        </MenubarPrimitive.ItemIndicator>
      </View>
      {renderTextChildren(children)}
    </StyledCheckboxItem>
  )
}

function MenubarRadioItem({ className, children, disabled, ...props }: WithClassName<MenubarPrimitive.RadioItemProps>) {
  return (
    <StyledRadioItem
      data-slot="menubar-radio-item"
      data-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <View className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <Icon as={CircleIcon} className="size-2 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </View>
      {renderTextChildren(children)}
    </StyledRadioItem>
  )
}

function MenubarLabel({
  className,
  inset,
  ...props
}: WithClassName<MenubarPrimitive.LabelProps> & {
  inset?: boolean
}) {
  return (
    <StyledLabel
      data-slot="menubar-label"
      data-inset={inset}
      className={cn("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", className)}
      {...props}
    />
  )
}

function MenubarSeparator({ className, ...props }: WithClassName<MenubarPrimitive.SeparatorProps>) {
  return <StyledSeparator data-slot="menubar-separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
}

function MenubarShortcut({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="menubar-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}

function MenubarSub(props: MenubarPrimitive.SubProps) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

function MenubarSubTrigger({
  className,
  inset,
  children,
  disabled,
  ...props
}: WithClassName<MenubarPrimitive.SubTriggerProps> & {
  inset?: boolean
}) {
  const { open } = MenubarPrimitive.useSubContext()
  return (
    <StyledSubTrigger
      data-slot="menubar-sub-trigger"
      data-inset={inset}
      data-state={open ? "open" : "closed"}
      data-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(
        "flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-[inset]:pl-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
      {/* The sub-menu opens inline below its trigger on native, so the chevron turns down. */}
      <Icon as={ChevronRightIcon} className={cn("ml-auto h-4 w-4", open && Platform.OS !== "web" && "rotate-90")} />
    </StyledSubTrigger>
  )
}

function MenubarSubContent({
  className,
  side: _side,
  sideOffset: _sideOffset,
  align: _align,
  alignOffset: _alignOffset,
  ...props
}: WithClassName<MenubarPrimitive.SubContentProps> & {
  side?: MenuSide
  sideOffset?: number
  align?: Align
  alignOffset?: number
}) {
  // Native sub-menus render inline under their trigger (positioning props are accepted for parity).
  const { open } = MenubarPrimitive.useSubContext()
  if (!open && !props.forceMount) return null
  return (
    <MenuPopupAnimation side="bottom" distance={4}>
      <StyledSubContent
        data-slot="menubar-sub-content"
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
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
}
