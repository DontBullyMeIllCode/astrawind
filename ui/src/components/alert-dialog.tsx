import * as React from "react"
import { useWindowDimensions } from "react-native"
import * as AlertDialogPrimitive from "@rn-primitives/alert-dialog"
import { IconStyle, styled, View, type ClassNameProps } from "@astrawind/css"
import { Button } from "./button"
import { renderTextChildren } from "../lib/children"
import {
  CenteredOverlayLayout,
  useControllableState,
  useOpenAnimation,
  usePresence,
  type PresenceContextValue,
} from "../lib/overlay"
import { cn } from "../lib/utils"

const AlertDialogTriggerPrimitive = styled(AlertDialogPrimitive.Trigger, { interactive: true })
const AlertDialogOverlayPrimitive = styled(AlertDialogPrimitive.Overlay) as unknown as React.ComponentType<
  AlertDialogPrimitive.OverlayProps & ClassNameProps
>
const AlertDialogContentPrimitive = styled(AlertDialogPrimitive.Content) as unknown as React.ComponentType<
  AlertDialogPrimitive.ContentProps & ClassNameProps
>
const AlertDialogTitlePrimitive = styled(AlertDialogPrimitive.Title, { kind: "text" })
const AlertDialogDescriptionPrimitive = styled(AlertDialogPrimitive.Description, { kind: "text" })

type ViewProps = React.ComponentProps<typeof View>

// The root renders a View; keep it out of the layout, like Radix's Root.
const ROOT_STYLE = { display: "contents" } as const
const SM = 640

const AlertDialogPresenceContext = React.createContext<PresenceContextValue>({ open: true, onExited: () => {} })
const AlertDialogSizeContext = React.createContext<"default" | "sm">("default")

type AlertDialogProps = Omit<AlertDialogPrimitive.RootProps, "open" | "defaultOpen" | "onOpenChange"> & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function AlertDialog({ open: openProp, defaultOpen = false, onOpenChange, ...props }: AlertDialogProps) {
  const [open, setOpen] = useControllableState({ prop: openProp, defaultProp: defaultOpen, onChange: onOpenChange })
  // The primitive stays open while the exit animation runs.
  const { present, onExited } = usePresence(open)
  const presence = React.useMemo(() => ({ open, onExited }), [open, onExited])
  return (
    <AlertDialogPresenceContext.Provider value={presence}>
      <AlertDialogPrimitive.Root
        data-slot="alert-dialog"
        style={ROOT_STYLE}
        open={present}
        onOpenChange={setOpen}
        {...props}
      />
    </AlertDialogPresenceContext.Provider>
  )
}

function AlertDialogTrigger(props: React.ComponentProps<typeof AlertDialogTriggerPrimitive>) {
  return <AlertDialogTriggerPrimitive data-slot="alert-dialog-trigger" {...props} />
}

function AlertDialogPortal(props: AlertDialogPrimitive.PortalProps) {
  return <AlertDialogPrimitive.Portal {...props} />
}

function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof AlertDialogOverlayPrimitive>) {
  const { open } = React.useContext(AlertDialogPresenceContext)
  return (
    <AlertDialogOverlayPrimitive
      data-slot="alert-dialog-overlay"
      data-state={open ? "open" : "closed"}
      // The fade runs in AlertDialogContent's layout (`animate-in fade-in-0` / `animate-out fade-out-0`).
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogContentPrimitive> & { size?: "default" | "sm" }) {
  const presence = React.useContext(AlertDialogPresenceContext)
  // `duration-200 fade-in-0 zoom-in-95` / `fade-out-0 zoom-out-95`.
  const progress = useOpenAnimation(presence.open, presence.onExited, 200)
  return (
    <AlertDialogPortal>
      <CenteredOverlayLayout progress={progress} overlay={<AlertDialogOverlay />}>
        <AlertDialogContentPrimitive
          data-slot="alert-dialog-content"
          data-size={size}
          data-state={presence.open ? "open" : "closed"}
          // `fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]`: the layout centers it,
          // and its `p-4` stands in for `max-w-[calc(100%-2rem)]`.
          className={cn(
            "group/alert-dialog-content z-50 mx-auto grid w-full gap-4 rounded-lg border bg-background p-6 shadow-lg data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-lg",
            className
          )}
          {...props}
        >
          <AlertDialogSizeContext.Provider value={size}>{renderTextChildren(children)}</AlertDialogSizeContext.Provider>
        </AlertDialogContentPrimitive>
      </CenteredOverlayLayout>
    </AlertDialogPortal>
  )
}

const HEADER =
  "flex flex-col items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:items-start sm:group-data-[size=default]/alert-dialog-content:text-left"

function AlertDialogHeader({ className, children, ...props }: ViewProps) {
  const size = React.useContext(AlertDialogSizeContext)
  const { width } = useWindowDimensions()
  // Web: a grid with `place-items-center` (a centered column). From `sm` in the default size, the media
  // spans two rows (`row-span-2`) and the title and description sit beside it (`col-start-2`).
  const items = React.Children.toArray(children)
  const media = items.filter((c) => React.isValidElement(c) && c.type === AlertDialogMedia)
  if (media.length && size === "default" && width >= SM) {
    const rest = items.filter((c) => !media.includes(c))
    return (
      <View data-slot="alert-dialog-header" className={cn(HEADER, "flex-row gap-x-6", className)} {...props}>
        {media}
        <View className="min-w-0 flex-1 flex-col items-start gap-1.5">{rest}</View>
      </View>
    )
  }
  return (
    <View data-slot="alert-dialog-header" className={cn(HEADER, className)} {...props}>
      {children}
    </View>
  )
}

function AlertDialogFooter({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogTitlePrimitive>) {
  // `col-start-2` beside the media: see AlertDialogHeader.
  return <AlertDialogTitlePrimitive data-slot="alert-dialog-title" className={cn("text-lg font-semibold", className)} {...props} />
}

function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogDescriptionPrimitive>) {
  return (
    <AlertDialogDescriptionPrimitive
      data-slot="alert-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function AlertDialogMedia({ className, children, ...props }: ViewProps) {
  // `row-span-2`: see AlertDialogHeader. `*:[svg:not([class*='size-'])]:size-8` → IconStyle.
  return (
    <View
      data-slot="alert-dialog-media"
      className={cn("mb-2 inline-flex size-16 items-center justify-center rounded-md bg-muted", className)}
      {...props}
    >
      <IconStyle size={32}>{children}</IconStyle>
    </View>
  )
}

type AlertDialogButtonProps = Omit<React.ComponentProps<typeof Button>, "asChild">

// Upstream renders the primitive inside `<Button asChild>`; here the primitive wraps the Button, which
// renders the same element with the same classes.
function AlertDialogAction({ className, variant = "default", size = "default", ...props }: AlertDialogButtonProps) {
  return (
    <AlertDialogPrimitive.Action asChild>
      <Button data-slot="alert-dialog-action" variant={variant} size={size} className={cn(className)} {...props} />
    </AlertDialogPrimitive.Action>
  )
}

function AlertDialogCancel({ className, variant = "outline", size = "default", ...props }: AlertDialogButtonProps) {
  return (
    <AlertDialogPrimitive.Cancel asChild>
      <Button data-slot="alert-dialog-cancel" variant={variant} size={size} className={cn(className)} {...props} />
    </AlertDialogPrimitive.Cancel>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  type AlertDialogProps,
}
