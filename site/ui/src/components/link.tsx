import * as React from "react"
import { Link, type Href } from "expo-router"
import { Pressable } from "@astrawind/css"

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
