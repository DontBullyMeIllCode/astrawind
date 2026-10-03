import * as React from "react"
import { Text, useTw, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { cn, hasClass } from "../lib/utils"

type ViewProps = React.ComponentProps<typeof View>
type TextProps = React.ComponentProps<typeof Text>

type CardProps = ViewProps & {
  /** `dash`: a dashed border without the shadow, like daisyUI's `card-dash`. Not in shadcn. */
  variant?: "default" | "dash"
}

function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <View
      data-slot="card"
      data-variant={variant}
      className={cn(
        "flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm",
        variant === "dash" && "border-dashed shadow-none",
        className
      )}
      {...props}
    />
  )
}

const HEADER = "flex flex-col items-start gap-2 px-6"

// `[.border-b]:pb-6` and `[.border-t]:pt-6`: a bordered header or footer gets padding on that side.

function CardHeader({ className, children, ...props }: ViewProps) {
  const tw = useTw()
  const items = React.Children.toArray(children)
  const actions = items.filter((c) => React.isValidElement(c) && c.type === CardAction)
  if (!actions.length) {
    return (
      <View data-slot="card-header" className={cn(HEADER, hasClass(className, "border-b") && "pb-6", className)} {...props}>
        {children}
      </View>
    )
  }
  // `has-data-[slot=card-action]:grid-cols-[1fr_auto]`: title and description stack in the
  // first column; the action spans both rows in the second.
  const gap = tw(cn(HEADER, className)).gap as number | undefined
  const rest = items.filter((c) => !actions.includes(c))
  return (
    <View
      data-slot="card-header"
      className={cn(HEADER, "flex-row", hasClass(className, "border-b") && "pb-6", className)}
      {...props}
    >
      <View className="min-w-0 flex-1 flex-col" style={{ gap }}>
        {rest}
      </View>
      {actions}
    </View>
  )
}

function CardTitle({ className, ...props }: TextProps) {
  return <Text role="heading" data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />
}

function CardDescription({ className, ...props }: TextProps) {
  return <Text data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

function CardAction({ className, ...props }: ViewProps) {
  return <View data-slot="card-action" className={cn("self-start", className)} {...props} />
}

function CardContent({ className, children, ...props }: ViewProps) {
  return (
    <View data-slot="card-content" className={cn("px-6", className)} {...props}>
      {renderTextChildren(children)}
    </View>
  )
}

function CardFooter({ className, ...props }: ViewProps) {
  return <View data-slot="card-footer" className={cn("flex items-center px-6", hasClass(className, "border-t") && "pt-6", className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent, type CardProps }
