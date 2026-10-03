import * as React from "react"
import { Platform, Pressable as RNPressable, StyleSheet, type LayoutChangeEvent } from "react-native"
import * as NavigationMenuPrimitive from "@rn-primitives/navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDownIcon } from "lucide-react-native"
import { styled, View } from "@astrawind/css"
import { Icon } from "./icon"
import { AnchoredLayer } from "../lib/anchored-layer"
import { renderTextChildren } from "../lib/children"
import { MenuPopupAnimation, useCollisionInsets } from "../lib/menu"
import { useControllableState, withHighlight } from "../lib/overlay"
import { cn } from "../lib/utils"

type WithClassName<P> = Omit<P, "children"> & { className?: string; children?: React.ReactNode }
type ViewProps = React.ComponentProps<typeof View>

const StyledRoot = styled(NavigationMenuPrimitive.Root) as React.ComponentType<WithClassName<NavigationMenuPrimitive.RootProps>>
const StyledList = styled(NavigationMenuPrimitive.List) as React.ComponentType<WithClassName<NavigationMenuPrimitive.ListProps>>
const StyledItem = styled(NavigationMenuPrimitive.Item) as React.ComponentType<WithClassName<NavigationMenuPrimitive.ItemProps>>
// On web the real hover and focus apply; native has neither, so a press highlights as focus.
const StyledTrigger = styled(Platform.OS === "web" ? NavigationMenuPrimitive.Trigger : withHighlight(NavigationMenuPrimitive.Trigger), {
  interactive: true,
}) as React.ComponentType<WithClassName<NavigationMenuPrimitive.TriggerProps>>
const StyledLink = styled(Platform.OS === "web" ? NavigationMenuPrimitive.Link : withHighlight(NavigationMenuPrimitive.Link), {
  interactive: true,
}) as React.ComponentType<WithClassName<NavigationMenuPrimitive.LinkProps>>
const StyledIndicator = styled(NavigationMenuPrimitive.Indicator) as React.ComponentType<
  WithClassName<NavigationMenuPrimitive.IndicatorProps>
>

interface ItemLayout {
  x: number
  width: number
}

interface NavigationMenuContextValue {
  viewport: boolean
  value: string
  setValue: (value: string) => void
  layouts: Record<string, ItemLayout>
  setLayout: (value: string, layout: ItemLayout) => void
}

const NavigationMenuContext = React.createContext<NavigationMenuContextValue | null>(null)

function useNavigationMenu() {
  const ctx = React.useContext(NavigationMenuContext)
  if (!ctx) throw new Error("NavigationMenu components must be used within <NavigationMenu>.")
  return ctx
}

type NavigationMenuProps = WithClassName<Omit<NavigationMenuPrimitive.RootProps, "value" | "onValueChange">> & {
  /** The open item's value, `""` when none is open. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  viewport?: boolean
}

/**
 * A row of triggers and links. Pressing a trigger opens its content below it
 * (Radix also opens on hover); pressing outside or a link closes it.
 */
function NavigationMenu({
  className,
  children,
  viewport = true,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  ...props
}: NavigationMenuProps) {
  const [value, setValue] = useControllableState<string>({ prop: valueProp, defaultProp: defaultValue, onChange: onValueChange })
  const [layouts, setLayouts] = React.useState<Record<string, ItemLayout>>({})
  const setLayout = React.useCallback((v: string, layout: ItemLayout) => {
    setLayouts((l) => (l[v]?.x === layout.x && l[v]?.width === layout.width ? l : { ...l, [v]: layout }))
  }, [])
  const context = React.useMemo(
    () => ({ viewport, value, setValue, layouts, setLayout }),
    [viewport, value, setValue, layouts, setLayout]
  )
  return (
    <NavigationMenuContext.Provider value={context}>
      <StyledRoot
        data-slot="navigation-menu"
        data-viewport={viewport}
        value={value}
        onValueChange={(next) => setValue(next ?? "")}
        className={cn(
          // `flex-1` is left out: in a native column it would stretch the bar vertically.
          "group/navigation-menu relative flex max-w-max items-center justify-center",
          className
        )}
        {...props}
      >
        {/* The viewport (`{viewport && <NavigationMenuViewport />}`) wraps each item's content in its popup on native. */}
        {children}
      </StyledRoot>
    </NavigationMenuContext.Provider>
  )
}

function NavigationMenuList({ className, ...props }: WithClassName<NavigationMenuPrimitive.ListProps>) {
  return (
    <StyledList
      data-slot="navigation-menu-list"
      className={cn("group flex flex-1 list-none items-center justify-center gap-1", className)}
      {...props}
    />
  )
}

function NavigationMenuItem({
  className,
  value,
  onLayout,
  ...props
}: WithClassName<Omit<NavigationMenuPrimitive.ItemProps, "value">> & { value?: string }) {
  const id = React.useId()
  const itemValue = value ?? id
  const { setLayout } = useNavigationMenu()
  return (
    <StyledItem
      data-slot="navigation-menu-item"
      value={itemValue}
      className={cn("relative", className)}
      onLayout={(e: LayoutChangeEvent) => {
        setLayout(itemValue, { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width })
        onLayout?.(e)
      }}
      {...props}
    />
  )
}

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-[color,box-shadow] outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent/50 data-[state=open]:text-accent-foreground data-[state=open]:hover:bg-accent data-[state=open]:focus:bg-accent"
)

function NavigationMenuTrigger({ className, asChild, children, ...props }: WithClassName<NavigationMenuPrimitive.TriggerProps>) {
  const { value } = useNavigationMenu()
  const { value: itemValue } = NavigationMenuPrimitive.useItemContext()
  const open = !!value && value === itemValue
  return (
    <StyledTrigger
      asChild={asChild}
      data-slot="navigation-menu-trigger"
      data-state={open ? "open" : "closed"}
      aria-expanded={open}
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      {...props}
    >
      {/* Upstream's `{" "}` between label and chevron is left out: `ml-1` spaces them. */}
      {asChild ? children : renderTextChildren(children)}
      <Icon
        as={ChevronDownIcon}
        className="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
        aria-hidden
      />
    </StyledTrigger>
  )
}

function NavigationMenuContent({ className, children, ...props }: ViewProps) {
  const { viewport, setValue } = useNavigationMenu()
  const insets = useCollisionInsets()
  const content = (
    <View
      data-slot="navigation-menu-content"
      data-state="open"
      className={cn(
        // `top-0 left-0 w-full md:absolute md:w-auto` placed the content in the shared viewport; the
        // `data-[motion=*]` slide/fade classes animated switching between items. Positioning is
        // rn-primitives' and the animation MenuPopupAnimation.
        "p-2 pr-2.5",
        // `group-data-[viewport=false]/navigation-menu:*` crosses the portal, so it reads the root's `viewport`.
        // `**:data-[slot=navigation-menu-link]:focus:ring-0 focus:outline-none` is left out: links show no focus ring on touch.
        !viewport && "mt-1.5 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow duration-200",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
  const popup = (
    <NavigationMenuPrimitive.Content side="bottom" align="start" sideOffset={0} insets={insets}>
      {/* `zoom-in-90` on the viewport, `zoom-in-95` on content without one. */}
      <MenuPopupAnimation side="bottom" distance={0} scale={viewport ? 0.9 : 0.95}>
        {viewport ? <NavigationMenuViewport>{content}</NavigationMenuViewport> : content}
      </MenuPopupAnimation>
    </NavigationMenuPrimitive.Content>
  )
  // On web rn-primitives renders the content inside its item, where upstream's `md:absolute top-full` places it.
  if (Platform.OS === "web") return <AnchoredLayer>{popup}</AnchoredLayer>
  return (
    <NavigationMenuPrimitive.Portal>
      <RNPressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => setValue("")}>
        {popup}
      </RNPressable>
    </NavigationMenuPrimitive.Portal>
  )
}

/**
 * The popup frame around an item's content. Radix renders one viewport under
 * the whole menu; on native each NavigationMenuContent is positioned under its
 * trigger and wraps itself in the viewport, so without children this renders nothing.
 */
function NavigationMenuViewport({ className, children, ...props }: ViewProps) {
  if (!children) return null
  return (
    // `absolute top-full left-0 isolate z-50 flex justify-center` wrapper: positioning is rn-primitives'.
    <View
      data-slot="navigation-menu-viewport"
      data-state="open"
      className={cn(
        // `origin-top-center`, `data-[state=*]:animate-*`/`zoom-*` are MenuPopupAnimation;
        // `h-[var(--radix-navigation-menu-viewport-height)] w-full md:w-[var(--radix-navigation-menu-viewport-width)]`
        // sized the shared viewport to the open content, which it now wraps.
        "relative mt-1.5 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow",
        className
      )}
      {...props}
    >
      {children}
    </View>
  )
}

function NavigationMenuLink({ className, asChild, active, onPress, children, ...props }: WithClassName<NavigationMenuPrimitive.LinkProps>) {
  const { setValue } = useNavigationMenu()
  return (
    <StyledLink
      asChild={asChild}
      data-slot="navigation-menu-link"
      data-active={active || undefined}
      aria-current={active ? "page" : undefined}
      active={active}
      onPress={(e) => {
        onPress?.(e)
        // Selecting a link closes the menu, as in Radix.
        setValue("")
      }}
      className={cn(
        // `[&_svg:not([class*='text-'])]:` → `[&_svg]:` (the default icon color).
        "flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground data-[active=true]:hover:bg-accent data-[active=true]:focus:bg-accent [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {asChild ? children : renderTextChildren(children)}
    </StyledLink>
  )
}

/** An arrow under the open item's trigger. Place it in NavigationMenuList. */
function NavigationMenuIndicator({ className, style, ...props }: WithClassName<NavigationMenuPrimitive.IndicatorProps>) {
  const { value, layouts } = useNavigationMenu()
  const layout = value ? layouts[value] : undefined
  if (!layout) return null
  return (
    <StyledIndicator
      data-slot="navigation-menu-indicator"
      data-state="visible"
      className={cn(
        // `absolute` and the left/width style are the position Radix sets; the fade classes are left out.
        "absolute top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden",
        className
      )}
      style={[{ left: layout.x, width: layout.width }, style]}
      {...props}
    >
      <View className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
    </StyledIndicator>
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
}
