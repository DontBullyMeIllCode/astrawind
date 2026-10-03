import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react-native"
import * as Slot from "@rn-primitives/slot"
import { Pressable, styled, Text, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { cn } from "../lib/utils"
import { Icon } from "./icon"

const SlotPressable = styled(Slot.Pressable, { interactive: true })

type ViewProps = React.ComponentProps<typeof View>

function Breadcrumb({ ...props }: ViewProps) {
  return <View role="navigation" aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }: ViewProps) {
  return (
    <View
      role="list"
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2.5",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, children, ...props }: ViewProps) {
  return (
    <View
      role="listitem"
      data-slot="breadcrumb-item"
      // `self-center`: `inline-flex` sets `alignSelf: flex-start`, which would override the list's `items-center`.
      className={cn("inline-flex items-center gap-1.5 self-center", className)}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

function BreadcrumbLink({
  asChild,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Pressable>, "children"> & {
  asChild?: boolean
  children?: React.ReactNode
}) {
  const Comp = asChild ? SlotPressable : Pressable

  return (
    <Comp
      role="link"
      data-slot="breadcrumb-link"
      className={cn("transition-colors hover:text-foreground active:text-foreground", className)}
      {...props}
    >
      {asChild ? children : renderTextChildren(children)}
    </Comp>
  )
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({ children, className, ...props }: ViewProps) {
  return (
    <View
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <Icon as={ChevronRight} />}
    </View>
  )
}

function BreadcrumbEllipsis({ className, ...props }: ViewProps) {
  return (
    <View
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden
      // The `sr-only` "More" becomes the label.
      aria-label="More"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <Icon as={MoreHorizontal} className="size-4" />
    </View>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
