import * as React from "react"
import { InfoIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import { Alert, AlertDescription, AlertTitle } from "@astrawind/ui/alert"
import { Icon } from "@astrawind/ui/icon"
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@astrawind/ui/table"
import { useTocHeading } from "./toc"

/** Building blocks for docs pages. */

/** `first` drops the top margin, for a heading that starts the page's content. */
export function H2({ children, id, first }: { children: string; id?: string; first?: boolean }) {
  const { ref, onLayout, id: headingId } = useTocHeading(children, 2, id)
  return (
    <View ref={ref} onLayout={onLayout} className={first ? "mb-4" : "mt-16 mb-4"} nativeID={headingId}>
      <Text role="heading" aria-level={2} className="text-xl font-semibold tracking-tight">
        {children}
      </Text>
    </View>
  )
}

export function H3({ children, id }: { children: string; id?: string }) {
  const { ref, onLayout, id: headingId } = useTocHeading(children, 3, id)
  return (
    <View ref={ref} onLayout={onLayout} className="mt-10 mb-3" nativeID={headingId}>
      <Text role="heading" aria-level={3} className="text-base font-semibold">
        {children}
      </Text>
    </View>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return <Text className="my-4 text-base/7 text-foreground/80">{children}</Text>
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <Text className="font-semibold text-foreground">{children}</Text>
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <View className="my-4 gap-2">{children}</View>
}

export function Li({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row gap-3 pl-1">
      <View className="mt-[11px] size-1.5 rounded-full bg-muted-foreground/60" />
      <Text className="flex-1 text-base/7 text-foreground/80">{children}</Text>
    </View>
  )
}

/** A callout, like the "Tip" boxes on tailwindcss.com. */
export function Note({ children, title = "Note" }: { children: React.ReactNode; title?: string }) {
  return (
    <Alert className="my-6">
      <Icon as={InfoIcon} />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <Text className="text-sm/6 text-muted-foreground">{children}</Text>
      </AlertDescription>
    </Alert>
  )
}

/** A frame around a live example, rendered on the page from the code below it. */
export function Preview({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn("my-6 items-center rounded-xl border bg-muted/40 p-8 dark:bg-muted/20", className)}>{children}</View>
}

/** A simple table: the first row is the header. Cells are strings or elements. */
export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  // The first column is narrower; the rest share the remaining width. Cells wrap.
  const col = (i: number) => (i === 0 ? "w-2/5 flex-none" : "")
  return (
    <View className="my-6 overflow-hidden rounded-xl border">
      <UITable>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {head.map((h, i) => (
              <TableHead key={i} className={cn("px-4", col(i))}>
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, r) => (
            <TableRow key={r}>
              {row.map((cell, i) => (
                <TableCell key={i} className={cn("px-4 py-2.5 whitespace-normal", col(i))}>
                  {typeof cell === "string" ? <Text className="text-sm/6 text-foreground/80">{cell}</Text> : cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </UITable>
    </View>
  )
}
