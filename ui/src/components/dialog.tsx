import * as React from "react"
import * as DialogPrimitive from "@rn-primitives/dialog"
import { XIcon } from "lucide-react-native"
import { styled, View, type ClassNameProps } from "@astrawind/css"
import { Button } from "./button"
import { Icon } from "./icon"
import { renderTextChildren } from "../lib/children"
import {
  CenteredOverlayLayout,
  useControllableState,
  useOpenAnimation,
  usePresence,
  type PresenceContextValue,
} from "../lib/overlay"
import { cn } from "../lib/utils"

const DialogTriggerPrimitive = styled(DialogPrimitive.Trigger, { interactive: true })
const DialogClosePrimitive = styled(DialogPrimitive.Close, { interactive: true })
const DialogOverlayPrimitive = styled(DialogPrimitive.Overlay) as unknown as React.ComponentType<
  DialogPrimitive.OverlayProps & ClassNameProps
>
const DialogContentPrimitive = styled(DialogPrimitive.Content) as unknown as React.ComponentType<
  DialogPrimitive.ContentProps & ClassNameProps
>
const DialogTitlePrimitive = styled(DialogPrimitive.Title, { kind: "text" })
const DialogDescriptionPrimitive = styled(DialogPrimitive.Description, { kind: "text" })

type ViewProps = React.ComponentProps<typeof View>

// The root renders a View; keep it out of the layout, like Radix's Root.
const ROOT_STYLE = { display: "contents" } as const

const DialogPresenceContext = React.createContext<PresenceContextValue>({ open: true, onExited: () => {} })

type DialogProps = Omit<DialogPrimitive.RootProps, "open" | "defaultOpen" | "onOpenChange"> & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function Dialog({ open: openProp, defaultOpen = false, onOpenChange, ...props }: DialogProps) {
  const [open, setOpen] = useControllableState({ prop: openProp, defaultProp: defaultOpen, onChange: onOpenChange })
  // The primitive stays open while the exit animation runs.
  const { present, onExited } = usePresence(open)
  const presence = React.useMemo(() => ({ open, onExited }), [open, onExited])
  return (
    <DialogPresenceContext.Provider value={presence}>
      <DialogPrimitive.Root data-slot="dialog" style={ROOT_STYLE} open={present} onOpenChange={setOpen} {...props} />
    </DialogPresenceContext.Provider>
  )
}

function DialogTrigger(props: React.ComponentProps<typeof DialogTriggerPrimitive>) {
  return <DialogTriggerPrimitive data-slot="dialog-trigger" {...props} />
}

function DialogPortal(props: DialogPrimitive.PortalProps) {
  return <DialogPrimitive.Portal {...props} />
}

function DialogClose(props: React.ComponentProps<typeof DialogClosePrimitive>) {
  return <DialogClosePrimitive data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogOverlayPrimitive>) {
  const { open } = React.useContext(DialogPresenceContext)
  return (
    <DialogOverlayPrimitive
      data-slot="dialog-overlay"
      data-state={open ? "open" : "closed"}
      // The fade runs in DialogContent's layout (`animate-in fade-in-0` / `animate-out fade-out-0`).
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      {...props}
    />
  )
}

type DialogContentProps = React.ComponentProps<typeof DialogContentPrimitive> & {
  showCloseButton?: boolean
}

function DialogContent({ className, children, showCloseButton = true, ...props }: DialogContentProps) {
  const presence = React.useContext(DialogPresenceContext)
  // `duration-200 fade-in-0 zoom-in-95` / `fade-out-0 zoom-out-95`.
  const progress = useOpenAnimation(presence.open, presence.onExited, 200)
  return (
    <DialogPortal>
      <CenteredOverlayLayout progress={progress} overlay={<DialogOverlay />}>
        <DialogContentPrimitive
          data-slot="dialog-content"
          data-state={presence.open ? "open" : "closed"}
          // `fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]`: the layout centers it,
          // and its `p-4` stands in for `max-w-[calc(100%-2rem)]`.
          className={cn(
            "z-50 mx-auto grid w-full gap-4 rounded-lg border bg-background p-6 shadow-lg outline-none sm:max-w-lg",
            className
          )}
          {...props}
        >
          {renderTextChildren(children)}
          {showCloseButton && (
            <DialogClosePrimitive
              data-slot="dialog-close"
              aria-label="Close"
              className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden active:opacity-100 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <Icon as={XIcon} />
            </DialogClosePrimitive>
          )}
        </DialogContentPrimitive>
      </CenteredOverlayLayout>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: ViewProps) {
  return <View data-slot="dialog-header" className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props} />
}

function DialogFooter({ className, showCloseButton = false, children, ...props }: ViewProps & { showCloseButton?: boolean }) {
  return (
    <View
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </View>
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogTitlePrimitive>) {
  return <DialogTitlePrimitive data-slot="dialog-title" className={cn("text-lg leading-none font-semibold", className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogDescriptionPrimitive>) {
  return (
    <DialogDescriptionPrimitive
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  type DialogProps,
}
