import * as React from "react"
import { Platform, StyleSheet } from "react-native"
import * as ContextMenuPrimitive from "@rn-primitives/context-menu"
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
import { useControllableState, withHighlight, type Align } from "../lib/overlay"
import { cn } from "../lib/utils"

type WithClassName<P> = Omit<P, "children"> & { className?: string; children?: React.ReactNode }
type ViewProps = React.ComponentProps<typeof View>
type TextProps = React.ComponentProps<typeof Text>

const StyledTrigger = styled(ContextMenuPrimitive.Trigger, { interactive: true }) as React.ComponentType<
  WithClassName<ContextMenuPrimitive.TriggerProps> & { ref?: React.Ref<ContextMenuPrimitive.TriggerRef> }
>
const StyledItem = styled(withHighlight(ContextMenuPrimitive.Item), { interactive: true }) as React.ComponentType<
  WithClassName<ContextMenuPrimitive.ItemProps>
>
const StyledCheckboxItem = styled(withHighlight(ContextMenuPrimitive.CheckboxItem), {
  interactive: true,
}) as React.ComponentType<WithClassName<ContextMenuPrimitive.CheckboxItemProps>>
const StyledRadioItem = styled(withHighlight(ContextMenuPrimitive.RadioItem), {
  interactive: true,
}) as React.ComponentType<WithClassName<ContextMenuPrimitive.RadioItemProps>>
const StyledSubTrigger = styled(withHighlight(ContextMenuPrimitive.SubTrigger), {
  interactive: true,
}) as React.ComponentType<WithClassName<ContextMenuPrimitive.SubTriggerProps>>
const StyledSubContent = styled(ContextMenuPrimitive.SubContent) as React.ComponentType<
  WithClassName<ContextMenuPrimitive.SubContentProps>
>
const StyledGroup = styled(ContextMenuPrimitive.Group) as React.ComponentType<WithClassName<ContextMenuPrimitive.GroupProps>>
const StyledLabel = styled(ContextMenuPrimitive.Label, { kind: "text" }) as React.ComponentType<
  WithClassName<ContextMenuPrimitive.LabelProps>
>
const StyledSeparator = styled(ContextMenuPrimitive.Separator) as React.ComponentType<
  WithClassName<ContextMenuPrimitive.SeparatorProps>
>

type ContextMenuProps = Omit<ContextMenuPrimitive.RootProps, "asChild">

/** `relativeTo="longPress"` (default): the menu opens where the trigger was long-pressed, as Radix opens it at the pointer. */
function ContextMenu(props: ContextMenuProps) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" style={ROOT_CONTENTS_STYLE} {...props} />
}

function ContextMenuTrigger({
  asChild,
  children,
  ...props
}: WithClassName<ContextMenuPrimitive.TriggerProps> & { ref?: React.Ref<ContextMenuPrimitive.TriggerRef> }) {
  const { open } = ContextMenuPrimitive.useRootContext()
  // Radix opens on right-click; rn-primitives opens on long-press (right-click on web).
  return (
    <StyledTrigger data-slot="context-menu-trigger" data-state={open ? "open" : "closed"} asChild={asChild} {...props}>
      {asChild ? children : renderTextChildren(children)}
    </StyledTrigger>
  )
}

function ContextMenuGroup(props: WithClassName<ContextMenuPrimitive.GroupProps>) {
  return <StyledGroup data-slot="context-menu-group" {...props} />
}

function ContextMenuPortal({ children, ...props }: ContextMenuPrimitive.PortalProps) {
  // Inside the content (around a sub-menu), sub-menus render inline on native.
  const inside = React.useContext(InsideMenuContentContext)
  if (inside) return <>{children}</>
  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props}>
      {children}
    </ContextMenuPrimitive.Portal>
  )
}

type ContextMenuContentProps = ViewProps & {
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?: CollisionPadding
}

function ContextMenuContent({
  className,
  alignOffset = 0,
  avoidCollisions = true,
  collisionPadding,
  style,
  children,
  ...props
}: ContextMenuContentProps) {
  const { pressPosition } = ContextMenuPrimitive.useRootContext() as { pressPosition?: { pageY: number; height: number } | null }
  const insets = useCollisionInsets(collisionPadding)
  const maxHeight = useAvailableHeight(pressPosition, 0, insets)
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Overlay style={Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined}>
        {/* Radix places the menu at the pointer, to its bottom-right: `side="bottom" align="start"`. */}
        <ContextMenuPrimitive.Content
          side="bottom"
          align="start"
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          insets={insets}
        >
          <MenuPopupAnimation side="bottom">
            <View
              data-slot="context-menu-content"
              data-side="bottom"
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
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Overlay>
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuItem({
  className,
  asChild,
  inset,
  variant = "default",
  disabled,
  children,
  ...props
}: WithClassName<ContextMenuPrimitive.ItemProps> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <StyledItem
      asChild={asChild}
      data-slot="context-menu-item"
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

type CheckboxItemProps = WithClassName<Omit<ContextMenuPrimitive.CheckboxItemProps, "checked" | "onCheckedChange">> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

function ContextMenuCheckboxItem({
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
      data-slot="context-menu-checkbox-item"
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
        <ContextMenuPrimitive.ItemIndicator>
          <Icon as={CheckIcon} className="size-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </View>
      {renderTextChildren(children)}
    </StyledCheckboxItem>
  )
}

type RadioGroupProps = Omit<ContextMenuPrimitive.RadioGroupProps, "value" | "onValueChange"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

function ContextMenuRadioGroup({ value: valueProp, defaultValue, onValueChange, ...props }: RadioGroupProps) {
  const [value, setValue] = useControllableState<string | undefined>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange as (value: string | undefined) => void,
  })
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      value={value}
      onValueChange={setValue}
      {...props}
    />
  )
}

function ContextMenuRadioItem({
  className,
  children,
  disabled,
  ...props
}: WithClassName<ContextMenuPrimitive.RadioItemProps>) {
  return (
    <StyledRadioItem
      data-slot="context-menu-radio-item"
      data-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <View className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <Icon as={CircleIcon} className="size-2 fill-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </View>
      {renderTextChildren(children)}
    </StyledRadioItem>
  )
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: WithClassName<ContextMenuPrimitive.LabelProps> & {
  inset?: boolean
}) {
  return (
    <StyledLabel
      data-slot="context-menu-label"
      data-inset={inset}
      className={cn("px-2 py-1.5 text-sm font-medium text-foreground data-[inset]:pl-8", className)}
      {...props}
    />
  )
}

function ContextMenuSeparator({ className, ...props }: WithClassName<ContextMenuPrimitive.SeparatorProps>) {
  return (
    <StyledSeparator data-slot="context-menu-separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
  )
}

function ContextMenuShortcut({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="context-menu-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}

function ContextMenuSub(props: ContextMenuPrimitive.SubProps) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  disabled,
  ...props
}: WithClassName<ContextMenuPrimitive.SubTriggerProps> & {
  inset?: boolean
}) {
  const { open } = ContextMenuPrimitive.useSubContext()
  return (
    <StyledSubTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      data-state={open ? "open" : "closed"}
      data-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(
        // `[&_svg:not([class*='text-'])]:` → `[&_svg]:` (the default icon color).
        "flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[inset]:pl-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
      {/* The sub-menu opens inline below its trigger on native, so the chevron turns down. */}
      <Icon as={ChevronRightIcon} className={cn("ml-auto", open && Platform.OS !== "web" && "rotate-90")} />
    </StyledSubTrigger>
  )
}

function ContextMenuSubContent({
  className,
  side: _side,
  sideOffset: _sideOffset,
  align: _align,
  alignOffset: _alignOffset,
  ...props
}: WithClassName<ContextMenuPrimitive.SubContentProps> & {
  side?: MenuSide
  sideOffset?: number
  align?: Align
  alignOffset?: number
}) {
  // Native sub-menus render inline under their trigger (positioning props are accepted for parity).
  const { open } = ContextMenuPrimitive.useSubContext()
  if (!open && !props.forceMount) return null
  return (
    <MenuPopupAnimation side="bottom" distance={4}>
      <StyledSubContent
        data-slot="context-menu-sub-content"
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
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
