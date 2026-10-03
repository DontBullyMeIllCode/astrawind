import * as React from "react"
import { ScrollView, Text, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { usePosition, withPositions } from "../lib/position"
import { cn } from "../lib/utils"

type ViewProps = React.ComponentProps<typeof View>

/*
 * React Native has no table layout. Rows are flex rows and cells share the row's
 * width equally (`flex-1`); give a cell a width (`w-24 flex-none`) to size its
 * column. The container scrolls sideways like web's `overflow-x-auto`.
 */

type Section = "header" | "body" | "footer" | undefined

const SectionContext = React.createContext<Section>(undefined)

function Table({ className, children, ...props }: ViewProps) {
  // `caption-bottom`: the caption renders after the rows wherever it's declared.
  const items = React.Children.toArray(children)
  const isCaption = (c: React.ReactNode) => React.isValidElement(c) && c.type === TableCaption
  return (
    <ScrollView
      horizontal
      data-slot="table-container"
      className="relative w-full"
      contentContainerClassName="min-w-full"
      showsHorizontalScrollIndicator={false}
    >
      {/* `grow` for `w-full`: a percentage of the scroll content would depend on its own width. */}
      <View role="table" data-slot="table" className={cn("grow caption-bottom text-sm", className)} {...props}>
        {items.filter((c) => !isCaption(c))}
        {items.filter(isCaption)}
      </View>
    </ScrollView>
  )
}

// `[&_tr]:border-b`: rows in the header get `border-b` (TableRow reads the section).
function TableHeader({ className, ...props }: ViewProps) {
  return (
    <SectionContext.Provider value="header">
      <View role="rowgroup" data-slot="table-header" className={className} {...props} />
    </SectionContext.Provider>
  )
}

// `[&_tr:last-child]:border-0`: the last row drops its border (TableRow reads its position).
function TableBody({ className, children, ...props }: ViewProps) {
  return (
    <SectionContext.Provider value="body">
      <View role="rowgroup" data-slot="table-body" className={className} {...props}>
        {withPositions(children, "table-section")}
      </View>
    </SectionContext.Provider>
  )
}

// `[&>tr]:last:border-b-0`: the last row drops its bottom border.
function TableFooter({ className, children, ...props }: ViewProps) {
  return (
    <SectionContext.Provider value="footer">
      <View
        role="rowgroup"
        data-slot="table-footer"
        className={cn("border-t bg-muted/50 font-medium", className)}
        {...props}
      >
        {withPositions(children, "table-section")}
      </View>
    </SectionContext.Provider>
  )
}

function TableRow({ className, ...props }: ViewProps) {
  const section = React.useContext(SectionContext)
  const last = usePosition("table-section")?.last
  return (
    <View
      role="row"
      data-slot="table-row"
      className={cn(
        "flex-row border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        section === "header" && "border-b",
        last && section === "body" && "border-0",
        last && section === "footer" && "border-b-0",
        className
      )}
      {...props}
    />
  )
}

function isCheckbox(child: React.ReactNode) {
  if (!React.isValidElement(child)) return false
  const type = child.type as { displayName?: string; name?: string }
  const name = typeof child.type === "string" ? "" : (type.displayName ?? type.name ?? "")
  return (child.props as { role?: string }).role === "checkbox" || /checkbox/i.test(name)
}

/**
 * `[&:has([role=checkbox])]:pr-0` and `[&>[role=checkbox]]:translate-y-[2px]`: a cell holding a
 * checkbox drops its right padding and nudges the checkbox down.
 */
function cellChildren(children: React.ReactNode) {
  let checkbox = false
  const items = React.Children.map(children, (child) => {
    if (!isCheckbox(child)) return child
    checkbox = true
    const el = child as React.ReactElement<{ className?: string }>
    return React.cloneElement(el, { className: cn(el.props.className, "translate-y-[2px]") })
  })
  // `whitespace-nowrap`: text stays on one line.
  return { checkbox, items: renderTextChildren(items, undefined, { numberOfLines: 1 }) }
}

function TableHead({ className, children, ...props }: ViewProps) {
  const { checkbox, items } = cellChildren(children)
  return (
    <View
      role="columnheader"
      data-slot="table-head"
      className={cn(
        // `flex-1 justify-center`: equal-width columns; `align-middle` centers vertically.
        "h-10 flex-1 justify-center px-2 text-left align-middle font-medium whitespace-nowrap text-foreground",
        checkbox && "pr-0",
        className
      )}
      {...props}
    >
      {items}
    </View>
  )
}

function TableCell({ className, children, ...props }: ViewProps) {
  const { checkbox, items } = cellChildren(children)
  return (
    <View
      role="cell"
      data-slot="table-cell"
      className={cn("flex-1 justify-center p-2 align-middle whitespace-nowrap", checkbox && "pr-0", className)}
      {...props}
    >
      {items}
    </View>
  )
}

// `text-center`: a <caption> is centered by default.
function TableCaption({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text data-slot="table-caption" className={cn("mt-4 text-center text-sm text-muted-foreground", className)} {...props} />
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
