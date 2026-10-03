import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@rn-primitives/slot"
import { Pressable, styled, Text, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { cn, hasClass } from "../lib/utils"
import { Separator } from "./separator"

const SlotPressable = styled(Slot.Pressable, { interactive: true })

type ViewProps = React.ComponentProps<typeof View>
type TextProps = React.ComponentProps<typeof Text>
type ChildProps = { className?: string; children?: React.ReactNode }

/** `group-has-[[data-slot=item-description]]/item:*`: whether the Item holds an ItemDescription. */
const ItemContext = React.createContext({ hasDescription: false, column: false })

function ItemGroup({ className, ...props }: ViewProps) {
  return <View role="list" data-slot="item-group" className={cn("group/item-group flex flex-col", className)} {...props} />
}

function ItemSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator data-slot="item-separator" orientation="horizontal" className={cn("my-0", className)} {...props} />
}

// `[a]:transition-colors [a]:hover:bg-accent/50` (an Item rendered as a link) applies to
// pressable Items: ones with `onPress` or `asChild`. See `pressableClass`.
const itemVariants = cva(
  "group/item flex flex-wrap items-center rounded-md border border-transparent text-sm transition-colors duration-100 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-border",
        muted: "bg-muted/50",
      },
      size: {
        default: "gap-4 p-4",
        sm: "gap-2.5 px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const pressableClass = "transition-colors hover:bg-accent/50 active:bg-accent/50"

function hasDescendant(children: React.ReactNode, type: React.ElementType, depth = 0): boolean {
  let found = false
  React.Children.forEach(children, (child) => {
    if (found || !React.isValidElement<ChildProps>(child)) return
    if (child.type === type) found = true
    else if (depth < 6) found = hasDescendant(child.props.children, type, depth + 1)
  })
  return found
}

/** `[&+[data-slot=item-content]]:flex-none`: an ItemContent right after another one doesn't grow. */
function mapItemChildren(children: React.ReactNode) {
  let prevWasContent = false
  return React.Children.map(renderTextChildren(children), (child) => {
    const isContent = React.isValidElement<ChildProps>(child) && child.type === ItemContent
    const out =
      isContent && prevWasContent
        ? React.cloneElement(child as React.ReactElement<ChildProps>, {
            className: cn((child as React.ReactElement<ChildProps>).props.className, "flex-none"),
          })
        : child
    prevWasContent = isContent
    return out
  })
}

type ItemProps = Omit<React.ComponentProps<typeof Pressable>, "children"> &
  VariantProps<typeof itemVariants> & { asChild?: boolean; children?: React.ReactNode }

/**
 * A list row. It's pressable with `onPress` (or `asChild` with a pressable/link child),
 * and a plain View otherwise.
 */
function Item({ className, variant = "default", size = "default", asChild = false, children, ...props }: ItemProps) {
  const pressable = asChild || !!(props.onPress || props.onLongPress)
  const column = hasClass(className, "flex-col")
  const shared = {
    "data-slot": "item",
    "data-variant": variant,
    "data-size": size,
    className: cn(
      itemVariants({ variant, size }),
      pressable && pressableClass,
      // A column item has nothing to wrap, and wrapping would move ItemFooter's `basis-full`
      // (a full-height basis in a column) into a second column on native.
      column && "flex-nowrap",
      className
    ),
  }

  if (asChild && React.isValidElement<ChildProps>(children)) {
    const child = children
    const ctx = { hasDescription: hasDescendant(child.props.children, ItemDescription), column }
    return (
      <ItemContext.Provider value={ctx}>
        <SlotPressable {...shared} {...props}>
          {React.cloneElement(child, {}, mapItemChildren(child.props.children))}
        </SlotPressable>
      </ItemContext.Provider>
    )
  }

  const ctx = { hasDescription: hasDescendant(children, ItemDescription), column }
  const content = mapItemChildren(children)
  return (
    <ItemContext.Provider value={ctx}>
      {pressable ? (
        <Pressable {...shared} {...props}>
          {content}
        </Pressable>
      ) : (
        <View {...shared} {...(props as ViewProps)}>
          {content}
        </View>
      )}
    </ItemContext.Provider>
  )
}

// `[&_img]:size-full [&_img]:object-cover` are given to Image children directly (see ItemMedia).
const itemMediaVariants = cva("flex shrink-0 items-center justify-center gap-2 [&_svg]:pointer-events-none", {
  variants: {
    variant: {
      default: "bg-transparent",
      icon: "size-8 rounded-sm border bg-muted [&_svg:not([class*='size-'])]:size-4",
      image: "size-10 overflow-hidden rounded-sm",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const isImage = (el: React.ReactElement) => {
  const t = el.type as { displayName?: string; name?: string } | string
  const name = typeof t === "string" ? t : (t.displayName ?? t.name ?? "")
  return /Image$|^img$/.test(name)
}

function ItemMedia({
  className,
  variant = "default",
  children,
  ...props
}: ViewProps & VariantProps<typeof itemMediaVariants>) {
  const { hasDescription } = React.useContext(ItemContext)
  const content =
    variant === "image"
      ? React.Children.map(children, (child) =>
          React.isValidElement<ChildProps>(child) && isImage(child)
            ? React.cloneElement(child, { className: cn("size-full object-cover", child.props.className) })
            : child
        )
      : children
  return (
    <View
      data-slot="item-media"
      data-variant={variant}
      className={cn(
        itemMediaVariants({ variant }),
        // `group-has-[[data-slot=item-description]]/item:translate-y-0.5 …:self-start`
        hasDescription && "translate-y-0.5 self-start",
        className
      )}
      {...props}
    >
      {content}
    </View>
  )
}

function ItemContent({ className, children, ...props }: ViewProps) {
  return (
    <View data-slot="item-content" className={cn("flex flex-1 flex-col gap-1", className)} {...props}>
      {renderTextChildren(children)}
    </View>
  )
}

function ItemTitle({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="item-title"
      className={cn("flex w-fit items-center gap-2 text-sm leading-snug font-medium", className)}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

// `[&>a]:*` (links inside the description) is left out: nest a styled link instead.
function ItemDescription({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="item-description"
      className={cn("line-clamp-2 text-sm leading-normal font-normal text-balance text-muted-foreground", className)}
      {...props}
    />
  )
}

function ItemActions({ className, children, ...props }: ViewProps) {
  return (
    <View data-slot="item-actions" className={cn("flex items-center gap-2", className)} {...props}>
      {renderTextChildren(children)}
    </View>
  )
}

function ItemHeader({ className, children, ...props }: ViewProps) {
  return (
    <View data-slot="item-header" className={cn("flex basis-full items-center justify-between gap-2", className)} {...props}>
      {renderTextChildren(children)}
    </View>
  )
}

function ItemFooter({ className, children, ...props }: ViewProps) {
  const { column } = React.useContext(ItemContext)
  return (
    <View
      data-slot="item-footer"
      // `basis-full` puts the footer on its own line in a row item; in a column item it would be a
      // full-height basis that squeezes the content, so it sizes to its content there.
      className={cn("flex basis-full items-center justify-between gap-2", column && "basis-auto", className)}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
}
