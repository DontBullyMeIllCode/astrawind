import * as React from "react"
import { Image as RNImage } from "react-native"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@rn-primitives/slot"
import { Image, Pressable, ScrollView, styled, Text, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { cn } from "../lib/utils"
import { Button } from "./button"

type ViewProps = React.ComponentProps<typeof View>
type TextProps = React.ComponentProps<typeof Text>

const SlotPressable = styled(Slot.Pressable, { interactive: true })

// `has-[>a,>button]:hover:bg-muted/50` → `data-pressed:bg-muted/50`: an AttachmentTrigger reports
// press and hover to its Attachment. `has-data-[slot=attachment-content|media]` → `data-has-content`
// and `data-has-media`: Attachment finds those parts among its JSX children (their `data-slot`
// is set inside the components, where `has-*` can't see it).
const attachmentVariants = cva(
  "group/attachment relative flex w-fit max-w-full min-w-0 shrink-0 flex-wrap rounded-xl border bg-card text-card-foreground transition-colors focus-within:ring-1 focus-within:ring-ring/50 data-pressed:bg-muted/50 data-[state=error]:border-destructive/30 data-[state=idle]:border-dashed",
  {
    variants: {
      size: {
        default:
          "gap-2 text-sm data-has-content:px-2.5 data-has-content:py-2 data-has-media:p-2",
        sm: "gap-2.5 text-xs data-has-content:px-2 data-has-content:py-1.5 data-has-media:p-1.5",
        xs: "gap-1.5 rounded-lg text-xs data-has-content:px-1.5 data-has-content:py-1 data-has-media:p-1",
      },
      orientation: {
        horizontal: "min-w-40 items-center",
        vertical: "w-24 flex-col data-has-content:w-30",
      },
    },
  }
)

const attachmentMediaVariants = cva(
  "relative flex aspect-square w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:w-8 group-data-[size=xs]/attachment:w-7 group-data-[size=xs]/attachment:rounded-md group-data-[state=error]/attachment:bg-destructive/10 group-data-[state=error]/attachment:text-destructive group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6! [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-6 group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        icon: "",
        image:
          "opacity-60 group-data-[state=done]/attachment:opacity-100 group-data-[state=idle]/attachment:opacity-100",
      },
    },
    defaultVariants: {
      variant: "icon",
    },
  }
)

type AttachmentState = "idle" | "uploading" | "processing" | "error" | "done"

const AttachmentPressContext = React.createContext<((pressed: boolean) => void) | null>(null)

function childSlots(children: React.ReactNode) {
  let media = false
  let content = false
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const slot = (child.props as Record<string, unknown>)["data-slot"]
    if (child.type === AttachmentMedia || slot === "attachment-media") media = true
    else if (child.type === AttachmentContent || slot === "attachment-content") content = true
  })
  return { media, content }
}

function Attachment({
  className,
  state = "done",
  size = "default",
  orientation = "horizontal",
  children,
  ...props
}: ViewProps &
  VariantProps<typeof attachmentVariants> & {
    state?: AttachmentState
  }) {
  const slots = childSlots(children)
  const [pressed, setPressed] = React.useState(false)
  return (
    <AttachmentPressContext.Provider value={setPressed}>
      <View
        data-slot="attachment"
        data-state={state}
        data-size={size}
        data-orientation={orientation}
        data-has-media={slots.media || undefined}
        data-has-content={slots.content || undefined}
        data-pressed={pressed || undefined}
        aria-busy={state === "uploading" || state === "processing" || undefined}
        className={cn(attachmentVariants({ size, orientation }), className)}
        {...props}
      >
        {renderTextChildren(children)}
      </View>
    </AttachmentPressContext.Provider>
  )
}

// web: *:[img]:aspect-square *:[img]:w-full *:[img]:object-cover
const IMAGE_CLASS = "aspect-square w-full object-cover"

function AttachmentMedia({
  className,
  variant = "icon",
  children,
  ...props
}: ViewProps & VariantProps<typeof attachmentMediaVariants>) {
  const content =
    variant === "image"
      ? React.Children.map(children, (child) => {
          if (!React.isValidElement<{ className?: string; style?: unknown }>(child)) return child
          if (child.type === Image) return React.cloneElement(child, { className: cn(IMAGE_CLASS, child.props.className) })
          if (child.type === RNImage) {
            return React.cloneElement(child, {
              style: [{ width: "100%", aspectRatio: 1 }, child.props.style],
              resizeMode: "cover",
            } as object)
          }
          return child
        })
      : children
  return (
    <View
      data-slot="attachment-media"
      data-variant={variant}
      className={cn(attachmentMediaVariants({ variant }), className)}
      {...props}
    >
      {renderTextChildren(content)}
    </View>
  )
}

function AttachmentContent({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="attachment-content"
      className={cn(
        "max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

// `shimmer` has no native equivalent: `animate-pulse` marks the title as busy instead.
function AttachmentTitle({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="attachment-title"
      numberOfLines={1}
      className={cn(
        "block max-w-full min-w-0 truncate font-medium group-data-[state=processing]/attachment:shimmer group-data-[state=uploading]/attachment:shimmer",
        "group-data-[state=processing]/attachment:animate-pulse group-data-[state=uploading]/attachment:animate-pulse",
        className
      )}
      {...props}
    />
  )
}

function AttachmentDescription({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="attachment-description"
      numberOfLines={1}
      className={cn(
        "mt-0.5 block min-w-0 truncate text-xs text-muted-foreground group-data-[state=error]/attachment:text-destructive/80",
        "max-w-full",
        className
      )}
      {...props}
    />
  )
}

function AttachmentActions({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="attachment-actions"
      className={cn(
        "relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:top-3 group-data-[orientation=vertical]/attachment:right-3 group-data-[orientation=vertical]/attachment:gap-1",
        className
      )}
      {...props}
    />
  )
}

function AttachmentAction({ className, variant, size = "icon-xs", ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="attachment-action"
      variant={variant ?? "ghost"}
      size={size}
      className={cn(className)}
      {...props}
    />
  )
}

/** Covers the attachment to make all of it pressable (web: an overlaid `<button>`). */
function AttachmentTrigger({
  className,
  asChild = false,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  ...props
}: React.ComponentProps<typeof Pressable> & {
  asChild?: boolean
}) {
  const setPressed = React.useContext(AttachmentPressContext)
  const Comp = asChild ? SlotPressable : Pressable

  return (
    <Comp
      data-slot="attachment-trigger"
      role="button"
      className={cn("absolute inset-0 z-10 outline-none", className)}
      onPressIn={(e) => {
        setPressed?.(true)
        onPressIn?.(e)
      }}
      onPressOut={(e) => {
        setPressed?.(false)
        onPressOut?.(e)
      }}
      onHoverIn={(e) => {
        setPressed?.(true)
        onHoverIn?.(e)
      }}
      onHoverOut={(e) => {
        setPressed?.(false)
        onHoverOut?.(e)
      }}
      {...props}
    />
  )
}

/**
 * A horizontally scrolling row of attachments. `className` styles the row, like the
 * web scroll container's gap and padding.
 */
function AttachmentGroup({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof ScrollView>, "horizontal">) {
  return (
    <ScrollView
      data-slot="attachment-group"
      horizontal
      showsHorizontalScrollIndicator={false}
      className="min-w-0 grow-0"
      contentContainerClassName={cn(
        "flex min-w-0 scroll-fade-x snap-x snap-mandatory scroll-px-1 scrollbar-none gap-3 overflow-x-auto overscroll-x-contain py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start",
        className
      )}
      {...props}
    >
      {children}
    </ScrollView>
  )
}

export {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
}
