import * as React from "react"
import type { Href } from "expo-router"
import { ArrowRightIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import { Badge } from "@astrawind/ui/badge"
import { Icon } from "@astrawind/ui/icon"
import { BoxLink } from "@/components/link"

/** The pill above page headings, linking to what's new. */
export function Announcement({ href, children }: { href: Href; children: string }) {
  return (
    <BoxLink href={href} className="self-center">
      <Badge variant="secondary" className="rounded-full">
        {children}
        <Icon as={ArrowRightIcon} />
      </Badge>
    </BoxLink>
  )
}

export function PageHeader({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <View className={cn("border-b px-4 py-8 md:py-16 lg:py-20", className)}>
      <View className="w-full max-w-4xl items-center gap-2 self-center">{children}</View>
    </View>
  )
}

export function PageHeaderHeading({ children }: { children: string }) {
  return (
    <Text
      role="heading"
      aria-level={1}
      className="max-w-2xl text-center text-4xl leading-tight font-semibold tracking-tight lg:text-5xl lg:leading-[1.1]"
    >
      {children}
    </Text>
  )
}

export function PageHeaderDescription({ children }: { children: string }) {
  return <Text className="max-w-3xl text-center text-base text-balance text-foreground/80 sm:text-lg">{children}</Text>
}

export function PageActions({ children }: { children?: React.ReactNode }) {
  return <View className="w-full flex-row flex-wrap items-center justify-center gap-2 pt-2">{children}</View>
}
