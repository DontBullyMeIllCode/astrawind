import * as React from "react"
import { Text, View } from "@astrawind/css"
import { useTocHeading } from "./toc"

/** Building blocks for docs pages, styled like ui.shadcn.com's MDX. */

export function H2({ children, id }: { children: string; id?: string }) {
  const heading = useTocHeading(children, 2, id)
  return (
    <View ref={heading.ref} onLayout={heading.onLayout} nativeID={heading.id} className="mt-12 mb-4">
      <Text role="heading" aria-level={2} className="text-xl font-semibold tracking-tight">
        {children}
      </Text>
    </View>
  )
}

export function H3({ children, id }: { children: string; id?: string }) {
  const heading = useTocHeading(children, 3, id)
  return (
    <View ref={heading.ref} onLayout={heading.onLayout} nativeID={heading.id} className="mt-8 mb-3">
      <Text role="heading" aria-level={3} className="text-lg font-semibold tracking-tight">
        {children}
      </Text>
    </View>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return <Text className="my-3 text-base/7">{children}</Text>
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <View className="my-3 gap-2 pl-2">{children}</View>
}

export function Li({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row gap-3">
      <Text className="text-base/7">•</Text>
      <Text className="flex-1 text-base/7">{children}</Text>
    </View>
  )
}
