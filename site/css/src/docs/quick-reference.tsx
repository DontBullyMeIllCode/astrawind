import * as React from "react"
import { Platform } from "react-native"
import { resolve, Text, useAstraWind, View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import { Button } from "@astrawind/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@astrawind/ui/table"
import utilities from "../generated/utilities.json"
import { nativeEffect } from "./native"

type Row = [cls: string, css: string]

interface PageData {
  /** Classes on the page. */
  total: number
  /** Classes with a native effect, on iOS/Android (counted by scripts/gen-docs.mjs). */
  native: number
  /** Rows of the quick reference, capped for the largest pages. */
  rows: Row[]
}

const data = utilities as unknown as { tailwind: string; pages: Record<string, PageData> }

export const TAILWIND_VERSION = data.tailwind

export function utilityData(slug: string): PageData {
  return data.pages[slug] ?? { total: 0, native: 0, rows: [] }
}

/** Rows shown before "Show all classes", like tailwindcss.com's collapsed tables. */
const COLLAPSED = 12

function useResolver() {
  const { compiled, colorScheme } = useAstraWind()
  return React.useCallback(
    (cls: string) =>
      resolve(cls, {
        getVar: compiled.getVar,
        breakpoints: compiled.breakpoints,
        containerSizes: compiled.containerSizes,
        rem: compiled.rem,
        em: compiled.rem,
        windowWidth: 1024,
        windowHeight: 768,
        colorScheme,
        platform: Platform.OS,
        rtl: false,
        self: { attrs: {} },
        groups: {},
        ancestors: [],
      }),
    [compiled, colorScheme]
  )
}

export function QuickReference({ slug }: { slug: string }) {
  const { rows, total } = utilityData(slug)
  const res = useResolver()
  const [expanded, setExpanded] = React.useState(false)
  const visible = expanded ? rows : rows.slice(0, COLLAPSED)

  if (!rows.length) return <Text className="text-sm text-muted-foreground">No classes.</Text>

  // Cells wrap: the CSS and native columns hold several declarations.
  const cell = "px-3 py-2 whitespace-normal"
  return (
    <View className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-1/4 flex-none px-3">Class</TableHead>
            <TableHead className="flex-[1.4] px-3">Styles</TableHead>
            <TableHead className="px-3">React Native</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map(([cls, css]) => {
            const lines = nativeEffect(cls, res)
            return (
              <TableRow key={cls}>
                <TableCell className={cn(cell, "w-1/4 flex-none justify-start")}>
                  <Text selectable className="font-mono text-xs/5 text-link">
                    {cls}
                  </Text>
                </TableCell>
                <TableCell className={cn(cell, "flex-[1.4] justify-start")}>
                  <Text selectable className="font-mono text-xs/5 text-muted-foreground">
                    {css}
                  </Text>
                </TableCell>
                <TableCell className={cn(cell, "justify-start")}>
                  {lines.length ? (
                    <Text selectable className="font-mono text-xs/5 text-muted-foreground">
                      {lines.join("\n")}
                    </Text>
                  ) : (
                    <Text className="text-xs/5 text-muted-foreground/70 italic">No native equivalent</Text>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {rows.length > COLLAPSED && (
        <View className="items-center border-t p-2">
          <Button variant="ghost" size="sm" onPress={() => setExpanded((e) => !e)}>
            {expanded ? "Show fewer classes" : `Show all ${rows.length} classes`}
          </Button>
        </View>
      )}
      {expanded && total > rows.length && (
        <Text className="px-3 pb-3 text-center text-xs text-muted-foreground">
          And {total - rows.length} more, with the same pattern.
        </Text>
      )}
    </View>
  )
}
