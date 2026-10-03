import * as React from "react"
import { Platform } from "react-native"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@rn-primitives/slot"
import { PanelLeftIcon } from "lucide-react-native"
import { Pressable, ScrollView, styled, View } from "@astrawind/css"
import { useIsMobile } from "../hooks/use-mobile"
import { Button } from "./button"
import { Icon } from "./icon"
import { Input } from "./input"
import { Separator } from "./separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./sheet"
import { Skeleton } from "./skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"
import { renderTextChildren } from "../lib/children"
import { cn } from "../lib/utils"

const SlotPressable = styled(Slot.Pressable, { interactive: true })
const SlotView = styled(Slot.View)

type ViewProps = React.ComponentProps<typeof View>
type PressableProps = Omit<React.ComponentProps<typeof Pressable>, "children"> & {
  asChild?: boolean
  children?: React.ReactNode
}

// `--sidebar-width` (16rem), `--sidebar-width-mobile` (18rem) and `--sidebar-width-icon` (3rem)
// are written as literal widths in the classes below (`w-[16rem]`, `w-[3rem]`, ...): the class
// audit resolves each class on its own, without the wrapper's inline variables.
const sidebarKeyboardShortcut = "b"

type KeyEvent = { key: string; metaKey?: boolean; ctrlKey?: boolean; preventDefault: () => void }
type KeyTarget = {
  addEventListener?: (type: "keydown", listener: (event: KeyEvent) => void) => void
  removeEventListener?: (type: "keydown", listener: (event: KeyEvent) => void) => void
}

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

/**
 * Native stand-in for `has-data-[variant=inset]:` on the wrapper and `peer-data-[variant=inset]:`
 * on SidebarInset: the desktop Sidebar registers its variant with the provider.
 */
type SidebarLayout = { variant?: string; setVariant: (variant: string | undefined) => void }
const SidebarLayoutContext = React.createContext<SidebarLayout>({ setVariant: () => {} })

/**
 * Native stand-in for `[[data-side=...][data-collapsible=...]_&]:` selectors: the Sidebar
 * tells its descendants its side and collapsed mode.
 */
type SidebarSideState = { side: "left" | "right"; collapsible: string }
const SidebarSideContext = React.createContext<SidebarSideState>({ side: "left", collapsible: "" })

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  children,
  ...props
}: ViewProps & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
      // The web version persists the state in a cookie; there's no cookie on native.
    },
    [setOpenProp, open]
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar (react-native-web only).
  React.useEffect(() => {
    const target = globalThis as KeyTarget
    if (Platform.OS !== "web" || !target.addEventListener) return
    const handleKeyDown = (event: KeyEvent) => {
      if (event.key === sidebarKeyboardShortcut && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    target.addEventListener("keydown", handleKeyDown)
    return () => target.removeEventListener?.("keydown", handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  const [variant, setVariant] = React.useState<string | undefined>(undefined)
  const layout = React.useMemo(() => ({ variant, setVariant }), [variant])

  return (
    <SidebarContext.Provider value={contextValue}>
      <SidebarLayoutContext.Provider value={layout}>
        <TooltipProvider delayDuration={0}>
          <View
            data-slot="sidebar-wrapper"
            className={cn(
              // `has-data-[variant=inset]:bg-sidebar`: see SidebarLayoutContext.
              "group/sidebar-wrapper flex min-h-svh w-full",
              variant === "inset" && "bg-sidebar",
              className
            )}
            {...props}
          >
            {children}
          </View>
        </TooltipProvider>
      </SidebarLayoutContext.Provider>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: ViewProps & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const sidebar = useSidebar()
  const { isMobile, state, openMobile, setOpenMobile } = sidebar
  const layout = React.useContext(SidebarLayoutContext)

  // Only the desktop sidebar carries `data-variant` for the wrapper and the inset to see.
  const registered = collapsible !== "none" && !isMobile ? variant : undefined
  const { setVariant } = layout
  React.useLayoutEffect(() => {
    setVariant(registered)
    return () => setVariant(undefined)
  }, [registered, setVariant])

  const dataCollapsible = state === "collapsed" ? collapsible : ""
  const sideState = React.useMemo(
    () => ({ side, collapsible: collapsible === "none" || isMobile ? "" : dataCollapsible }),
    [side, collapsible, isMobile, dataCollapsible]
  )

  if (collapsible === "none") {
    return (
      <View
        data-slot="sidebar"
        className={cn("flex h-full w-[16rem] flex-col bg-sidebar text-sidebar-foreground", className)}
        {...props}
      >
        <SidebarSideContext.Provider value={sideState}>{children}</SidebarSideContext.Provider>
      </View>
    )
  }

  if (isMobile) {
    // The sheet renders in a portal, outside this tree: its contents get the contexts again.
    // `[&>button]:hidden` hides the sheet's close button: `showCloseButton={false}`.
    // The web version passes the remaining props to the Sheet root, which ignores them.
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="w-[18rem] bg-sidebar p-0 text-sidebar-foreground"
          side={side}
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <SidebarContext.Provider value={sidebar}>
            <SidebarLayoutContext.Provider value={layout}>
              <SidebarSideContext.Provider value={sideState}>
                <View className="flex h-full w-full flex-col">{children}</View>
              </SidebarSideContext.Provider>
            </SidebarLayoutContext.Provider>
          </SidebarContext.Provider>
        </SheetContent>
      </Sheet>
    )
  }

  const inset = variant === "floating" || variant === "inset"

  return (
    <View
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={dataCollapsible}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop. Its width animates with `transition-[width]`. */}
      <View
        data-slot="sidebar-gap"
        className={cn(
          "relative w-[16rem] bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          inset
            ? "group-data-[collapsible=icon]:w-[calc(3rem+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-[3rem]"
        )}
      />
      {/* `fixed` is relative to the sidebar here, which spans the wrapper's height: `h-svh` is left
          out so `inset-y-0` sizes the container to it. */}
      <View
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden w-[16rem] transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(16rem*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(16rem*-1)]",
          // Adjust the padding for floating and inset variants.
          inset
            ? "p-2 group-data-[collapsible=icon]:w-[calc(3rem+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-[3rem] group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <View
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm"
        >
          <SidebarSideContext.Provider value={sideState}>{children}</SidebarSideContext.Provider>
        </View>
      </View>
    </View>
  )
}

function SidebarTrigger({ className, onPress, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      aria-label="Toggle Sidebar"
      className={cn("size-7", className)}
      onPress={(event) => {
        onPress?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <Icon as={PanelLeftIcon} />
    </Button>
  )
}

function SidebarRail({ className, ...props }: Omit<React.ComponentProps<typeof Pressable>, "children">) {
  const { toggleSidebar } = useSidebar()
  const { side, collapsible } = React.useContext(SidebarSideContext)
  const offcanvas = collapsible === "offcanvas"

  return (
    <Pressable
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      role="button"
      tabIndex={-1}
      onPress={toggleSidebar}
      className={cn(
        // `after:` is a real View below; `group/rail` gives it the rail's hover state.
        "group/rail absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        // `[[data-side=left][data-collapsible=offcanvas]_&]:-right-2` and the right-side twin.
        offcanvas && side === "left" && "group-data-[side=left]:-right-2",
        offcanvas && side === "right" && "group-data-[side=right]:-left-2",
        className
      )}
      {...props}
    >
      <View className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] group-hover/rail:bg-sidebar-border group-active/rail:bg-sidebar-border group-data-[collapsible=offcanvas]:left-full"
      />
    </Pressable>
  )
}

function SidebarInset({ className, ...props }: ViewProps) {
  const { variant } = React.useContext(SidebarLayoutContext)
  const { state } = useSidebar()
  return (
    <View
      role="main"
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        // `md:peer-data-[variant=inset]:*`: see SidebarLayoutContext.
        variant === "inset" && "md:m-2 md:ml-0 md:rounded-xl md:shadow-sm",
        variant === "inset" && state === "collapsed" && "md:ml-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("h-8 w-full bg-background shadow-none", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: ViewProps) {
  return <View data-slot="sidebar-header" data-sidebar="header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
}

function SidebarFooter({ className, ...props }: ViewProps) {
  return <View data-slot="sidebar-footer" data-sidebar="footer" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: ViewProps) {
  const { collapsible } = React.useContext(SidebarSideContext)
  // `overflow-auto`: a ScrollView around the content; it stops scrolling when collapsed to
  // icons (`group-data-[collapsible=icon]:overflow-hidden`).
  return (
    <ScrollView
      className="min-h-0 flex-1"
      contentContainerClassName="grow"
      scrollEnabled={collapsible !== "icon"}
      showsVerticalScrollIndicator={false}
    >
      <View
        data-slot="sidebar-content"
        data-sidebar="content"
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 group-data-[collapsible=icon]:overflow-hidden",
          className
        )}
        {...props}
      />
    </ScrollView>
  )
}

function SidebarGroup({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({ className, asChild = false, children, ...props }: ViewProps & { asChild?: boolean }) {
  const Comp = asChild ? SlotView : View

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    >
      {asChild ? children : renderTextChildren(children)}
    </Comp>
  )
}

function SidebarGroupAction({ className, asChild = false, children, ...props }: PressableProps) {
  const Comp = asChild ? SlotPressable : Pressable
  const { isMobile } = useSidebar()

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      role="button"
      // `after:absolute after:-inset-2 md:after:hidden`: increases the hit area of the button on mobile.
      hitSlop={isMobile ? 8 : undefined}
      className={cn(
        "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}

function SidebarGroupContent({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: ViewProps) {
  return (
    <View
      role="list"
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
}

/**
 * The web styles menu actions and badges with `peer-data-[size|active]/menu-button:` and the
 * button with `group-has-data-[sidebar=menu-action]/menu-item:`. Here the item shares that state.
 */
type MenuItemState = {
  size: string
  active: boolean
  hasAction: boolean
  setSize: (size: string) => void
  setActive: (active: boolean) => void
  setHasAction: (has: boolean) => void
}

const MenuItemContext = React.createContext<MenuItemState | null>(null)

function SidebarMenuItem({ className, ...props }: ViewProps) {
  const [size, setSize] = React.useState("default")
  const [active, setActive] = React.useState(false)
  const [hasAction, setHasAction] = React.useState(false)
  const value = React.useMemo(() => ({ size, active, hasAction, setSize, setActive, setHasAction }), [size, active, hasAction])

  return (
    <MenuItemContext.Provider value={value}>
      <View
        role="listitem"
        data-slot="sidebar-menu-item"
        data-sidebar="menu-item"
        className={cn("group/menu-item relative", className)}
        {...props}
      />
    </MenuItemContext.Provider>
  )
}

const sidebarMenuButtonVariants = cva(
  // `group-has-data-[sidebar=menu-action]/menu-item:pr-8` comes from the item (MenuItemContext), and
  // `[&>span:last-child]:truncate` truncates text children to one line. `peer/menu-button` is left out:
  // actions and badges read the button's state from the item, and a `peer` child makes the
  // tooltip trigger's Slot receive an array.
  "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  disabled,
  children,
  ...props
}: PressableProps & {
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? SlotPressable : Pressable
  const { isMobile, state } = useSidebar()
  const item = React.useContext(MenuItemContext)
  const resolvedSize = size ?? "default"
  const setSize = item?.setSize
  const setActive = item?.setActive
  React.useLayoutEffect(() => {
    setSize?.(resolvedSize)
    setActive?.(isActive)
  }, [resolvedSize, isActive, setSize, setActive])

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={resolvedSize}
      data-active={isActive}
      role="button"
      disabled={disabled}
      aria-disabled={disabled ?? undefined}
      className={cn(sidebarMenuButtonVariants({ variant, size }), item?.hasAction && "pr-8", className)}
      {...props}
    >
      {asChild ? children : renderTextChildren(children, "shrink", { numberOfLines: 1 })}
    </Comp>
  )

  // The web renders the content with `hidden`; here the tooltip is left out instead.
  if (!tooltip || state !== "collapsed" || isMobile) {
    return button
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center" {...tooltip} />
    </Tooltip>
  )
}

/** `peer-data-[size=*]/menu-button:top-*`, from the item's button size. */
function peerTop(size: string | undefined) {
  return size === "sm" ? "top-1" : size === "lg" ? "top-2.5" : "top-1.5"
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  children,
  ...props
}: PressableProps & {
  showOnHover?: boolean
}) {
  const Comp = asChild ? SlotPressable : Pressable
  const { isMobile } = useSidebar()
  const item = React.useContext(MenuItemContext)
  const setHasAction = item?.setHasAction
  React.useLayoutEffect(() => {
    setHasAction?.(true)
    return () => setHasAction?.(false)
  }, [setHasAction])

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      role="button"
      // `after:absolute after:-inset-2 md:after:hidden`: increases the hit area of the button on mobile.
      hitSlop={isMobile ? 8 : undefined}
      className={cn(
        // `peer-hover/menu-button:text-sidebar-accent-foreground` is left out: it needs the
        // sibling button's hover state, and touch screens have none.
        "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        peerTop(item?.size),
        "group-data-[collapsible=icon]:hidden",
        showOnHover && "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100",
        showOnHover && item?.active && "text-sidebar-accent-foreground",
        // Hidden until hover only where there is a pointer to hover with.
        showOnHover && Platform.OS === "web" && "md:opacity-0",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}

function SidebarMenuBadge({ className, children, ...props }: ViewProps) {
  const item = React.useContext(MenuItemContext)
  return (
    <View
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none",
        // `peer-hover/menu-button:` is left out (see SidebarMenuAction); `peer-data-[active=true]/menu-button:`.
        item?.active && "text-sidebar-accent-foreground",
        peerTop(item?.size),
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: ViewProps & {
  showIcon?: boolean
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%` as `${number}%`
  }, [])

  return (
    <View
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
      {/* `max-w-(--skeleton-width)`: the width goes to `style`. */}
      <Skeleton className="h-4 flex-1" data-sidebar="menu-skeleton-text" style={{ maxWidth: width }} />
    </View>
  )
}

function SidebarMenuSub({ className, ...props }: ViewProps) {
  return (
    <View
      role="list"
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({ className, ...props }: ViewProps) {
  return (
    <View
      role="listitem"
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  disabled,
  children,
  ...props
}: PressableProps & {
  size?: "sm" | "md"
  isActive?: boolean
}) {
  const Comp = asChild ? SlotPressable : Pressable

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      role="link"
      disabled={disabled}
      aria-disabled={disabled ?? undefined}
      className={cn(
        // `[&>span:last-child]:truncate`: text children are truncated to one line.
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    >
      {asChild ? children : renderTextChildren(children, "shrink", { numberOfLines: 1 })}
    </Comp>
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
