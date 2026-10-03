import * as React from "react"
import { Text } from "@astrawind/css"

/**
 * Wraps bare strings and numbers in <Text> so box components accept text
 * children like their web counterparts (`<Button>Save</Button>`). Text styles
 * set on the box cascade to that Text.
 */
export function renderTextChildren(
  children: React.ReactNode,
  className?: string,
  textProps?: Omit<React.ComponentProps<typeof Text>, "className" | "children">
): React.ReactNode {
  // Adjacent strings and numbers form one run of text (`Hello {name}!` is one line, as in
  // HTML), so they share a Text instead of stacking as separate blocks.
  const out: React.ReactNode[] = []
  let run: (string | number)[] = []
  const flush = () => {
    if (!run.length) return
    out.push(
      <Text key={`text-${out.length}`} className={className} {...textProps}>
        {run.join("")}
      </Text>
    )
    run = []
  }
  React.Children.forEach(children, (child) => {
    if (typeof child === "string" || typeof child === "number") run.push(child)
    else if (child != null && typeof child !== "boolean") {
      flush()
      out.push(React.isValidElement(child) && child.key == null ? React.cloneElement(child, { key: `child-${out.length}` }) : child)
    }
  })
  flush()
  return out.length === 1 ? out[0] : out
}

/** Text of a node, for filtering and accessibility labels. */
export function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (React.isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children)
  return ""
}
