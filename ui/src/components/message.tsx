import * as React from "react"
import { View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { cn } from "../lib/utils"

type ViewProps = React.ComponentProps<typeof View>

function MessageGroup({ className, ...props }: ViewProps) {
  return <View data-slot="message-group" className={cn("flex min-w-0 flex-col gap-2", className)} {...props} />
}

/**
 * `group-has-data-[slot=message-footer]/message` and `group-has-data-[variant=ghost]/message`:
 * `has-*` only sees props written in JSX, and `data-slot`/`data-variant` are set inside the
 * components, so Message looks for a MessageFooter and a `variant="ghost"` element (a ghost
 * Bubble or Button) among its JSX descendants and exposes them as data attributes.
 */
function scanMessage(children: React.ReactNode, found = { footer: false, ghost: false }, depth = 0) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const p = child.props as Record<string, unknown> & { children?: React.ReactNode }
    if (child.type === MessageFooter || p["data-slot"] === "message-footer") found.footer = true
    if (p.variant === "ghost" || p["data-variant"] === "ghost") found.ghost = true
    if (depth < 6 && p.children) scanMessage(p.children, found, depth + 1)
  })
  return found
}

function Message({ className, align = "start", children, ...props }: ViewProps & { align?: "start" | "end" }) {
  const has = scanMessage(children)
  return (
    <View
      data-slot="message"
      data-align={align}
      data-has-footer={has.footer || undefined}
      data-has-ghost={has.ghost || undefined}
      className={cn(
        "group/message relative flex w-full min-w-0 gap-2 text-sm data-[align=end]:flex-row-reverse",
        className
      )}
      {...props}
    >
      {children}
    </View>
  )
}

function MessageAvatar({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="message-avatar"
      className={cn(
        "flex w-fit min-w-8 shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-muted group-data-has-footer/message:-translate-y-8",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

function MessageContent({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="message-content"
      className={cn(
        "flex w-full min-w-0 flex-col gap-2.5 wrap-break-word group-data-[align=end]/message:*:data-slot:self-end",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

function MessageHeader({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="message-header"
      className={cn(
        "flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-muted-foreground group-data-has-ghost/message:px-0",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

function MessageFooter({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="message-footer"
      className={cn(
        "flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-muted-foreground group-data-has-ghost/message:px-0 group-data-[align=end]/message:justify-end",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

export { MessageGroup, Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader }
