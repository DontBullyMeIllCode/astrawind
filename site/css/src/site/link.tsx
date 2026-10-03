import * as React from "react"
import { Link, type Href } from "expo-router"
import { Pressable, Text } from "@astrawind/css"

/** An expo-router link rendered as a pressable box (an `<a>` on the web). */
export function BoxLink({
  href,
  className,
  children,
  ...props
}: { href: Href; className?: string; children?: React.ReactNode } & Omit<React.ComponentProps<typeof Pressable>, "children">) {
  return (
    <Link href={href} asChild>
      <Pressable className={className} {...props}>
        {children}
      </Pressable>
    </Link>
  )
}

/** An inline text link. */
export function TextLink({ href, className, children }: { href: Href; className?: string; children?: React.ReactNode }) {
  return (
    <Link href={href} asChild>
      <Text className={className ?? "font-semibold text-sky-600 underline decoration-sky-400 underline-offset-2 hover:decoration-2 dark:text-sky-400"}>
        {children}
      </Text>
    </Link>
  )
}
