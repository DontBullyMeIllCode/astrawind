import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Text, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { cn } from "../lib/utils"

type ViewProps = React.ComponentProps<typeof View>
type TextProps = React.ComponentProps<typeof Text>

function Empty({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="empty"
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

function EmptyHeader({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-2 text-center", className)}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function EmptyMedia({ className, variant = "default", ...props }: ViewProps & VariantProps<typeof emptyMediaVariants>) {
  return (
    <View
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: TextProps) {
  return <Text data-slot="empty-title" className={cn("text-lg font-medium tracking-tight", className)} {...props} />
}

// `[&>a]:*` is left out: a link inside the description is a nested <Text> that styles itself.
function EmptyDescription({ className, ...props }: TextProps) {
  return (
    <Text data-slot="empty-description" className={cn("text-sm/relaxed text-muted-foreground", className)} {...props} />
  )
}

function EmptyContent({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="empty-content"
      className={cn("flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance", className)}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia }
