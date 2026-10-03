import * as React from "react"
import { Platform } from "react-native"
import { Pressable, resolve, Text, useAstraWind, View } from "@astrawind/css"
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

  if (!rows.length) return <Text className="text-sm text-gray-500">No classes.</Text>

  return (
    <View className="overflow-hidden rounded-xl border border-gray-950/10 dark:border-white/10">
      <View className="flex-row border-b border-gray-950/10 bg-gray-50 dark:border-white/10 dark:bg-white/5">
        <Text className="w-1/4 px-3 py-2 text-sm font-semibold text-gray-950 dark:text-white">Class</Text>
        <Text className="flex-[1.4] px-3 py-2 text-sm font-semibold text-gray-950 dark:text-white">Styles</Text>
        <Text className="flex-1 px-3 py-2 text-sm font-semibold text-gray-950 dark:text-white">React Native</Text>
      </View>
      {visible.map(([cls, css]) => {
        const lines = nativeEffect(cls, res)
        return (
          <View key={cls} className="flex-row border-b border-gray-950/5 dark:border-white/5">
            <Text selectable className="w-1/4 px-3 py-2 font-mono text-xs/5 text-sky-700 dark:text-sky-400">
              {cls}
            </Text>
            <Text selectable className="flex-[1.4] px-3 py-2 font-mono text-xs/5 text-gray-600 dark:text-gray-400">
              {css}
            </Text>
            {lines.length ? (
              <Text selectable className="flex-1 px-3 py-2 font-mono text-xs/5 text-gray-600 dark:text-gray-400">
                {lines.join("\n")}
              </Text>
            ) : (
              <Text className="flex-1 px-3 py-2 text-xs/5 text-gray-400 italic dark:text-gray-500">No native equivalent</Text>
            )}
          </View>
        )
      })}
      {rows.length > COLLAPSED && (
        <Pressable
          onPress={() => setExpanded((e) => !e)}
          className="items-center py-2.5 hover:bg-gray-50 active:bg-gray-50 dark:hover:bg-white/5 dark:active:bg-white/5"
        >
          <Text className="text-sm font-medium text-gray-950 dark:text-white">
            {expanded ? "Show fewer classes" : `Show all ${rows.length} classes`}
          </Text>
        </Pressable>
      )}
      {expanded && total > rows.length && (
        <Text className="px-3 pb-3 text-center text-xs text-gray-500">
          And {total - rows.length} more, with the same pattern.
        </Text>
      )}
    </View>
  )
}
