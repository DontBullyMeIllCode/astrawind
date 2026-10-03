import * as React from "react"
import { Text, View } from "@astrawind/css"
import { useTocHeading } from "./toc"

/** Building blocks for docs pages, styled like tailwindcss.com's prose. */

/** `first` drops the top margin, for a heading that starts the page's content. */
export function H2({ children, id, first }: { children: string; id?: string; first?: boolean }) {
  const heading = useTocHeading(children, 2, id)
  return (
    <View ref={heading.ref} onLayout={heading.onLayout} className={first ? "mb-4" : "mt-16 mb-4"} nativeID={heading.id}>
      <Text role="heading" aria-level={2} className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">
        {children}
      </Text>
    </View>
  )
}

export function H3({ children, id }: { children: string; id?: string }) {
  const heading = useTocHeading(children, 3, id)
  return (
    <View ref={heading.ref} onLayout={heading.onLayout} className="mt-10 mb-3" nativeID={heading.id}>
      <Text role="heading" aria-level={3} className="text-base font-semibold text-gray-950 dark:text-white">
        {children}
      </Text>
    </View>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return <Text className="my-4 text-base/7 text-gray-700 dark:text-gray-300">{children}</Text>
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <Text className="font-semibold text-gray-950 dark:text-white">{children}</Text>
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <View className="my-4 gap-2">{children}</View>
}

export function Li({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row gap-3 pl-1">
      <View className="mt-[11px] size-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
      <Text className="flex-1 text-base/7 text-gray-700 dark:text-gray-300">{children}</Text>
    </View>
  )
}

/** A callout, like the "Tip" boxes on tailwindcss.com. */
export function Note({ children, title = "Note" }: { children: React.ReactNode; title?: string }) {
  return (
    <View className="my-6 rounded-xl border border-sky-500/20 bg-sky-50 p-4 dark:bg-sky-500/5">
      <Text className="text-sm/6 text-gray-700 dark:text-gray-300">
        <Text className="font-semibold text-sky-700 dark:text-sky-400">{title}: </Text>
        {children}
      </Text>
    </View>
  )
}

/** A simple table: the first row is the header. Cells are strings or elements. */
export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <View className="my-6 overflow-hidden rounded-xl border border-gray-950/10 dark:border-white/10">
      <View className="flex-row border-b border-gray-950/10 bg-gray-50 dark:border-white/10 dark:bg-white/5">
        {head.map((h, i) => (
          <Text key={i} className={`${i === 0 ? "w-2/5" : "flex-1"} px-4 py-2 text-sm font-semibold text-gray-950 dark:text-white`}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, r) => (
        <View key={r} className="flex-row border-b border-gray-950/5 last:border-b-0 dark:border-white/5">
          {row.map((cell, i) => (
            <View key={i} className={`${i === 0 ? "w-2/5" : "flex-1"} px-4 py-2.5`}>
              {typeof cell === "string" ? <Text className="text-sm/6 text-gray-700 dark:text-gray-300">{cell}</Text> : cell}
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}
