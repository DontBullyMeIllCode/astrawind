import * as React from "react"
import type { Resolved } from "../core/resolve"
import type { Attrs, ElementState } from "../core/variants"

/**
 * What a parent tells its children about their place in it. CSS gets this from
 * the DOM; here the parent passes it down when it clones its children:
 * sibling position (first:, nth-*), divide borders, grid cell width, and the
 * peer store for peer-* variants.
 */
export interface Injected {
  index?: number
  count?: number
  /** Lowest-priority styles from the parent (divide borders); the child's own classes win. */
  base?: Record<string, unknown>
  grid?: { cols: number; colWidth: number; gap: number }
  peers?: PeerStore
}

export const INJECTED = "__astra"

/** Shared state of `peer` siblings, owned by their parent. */
export class PeerStore {
  private states: Record<string, ElementState> = {}
  private listeners = new Set<() => void>()
  private keys: Record<string, string> = {}
  set(name: string, state: ElementState, key: string) {
    if (this.keys[name] === key) return
    this.keys[name] = key
    this.states = { ...this.states, [name]: state }
    for (const l of this.listeners) l()
  }
  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }
  get = () => this.states
}

export const NO_PEERS = new PeerStore()

type AnyProps = Record<string, any>

/** Variants that need the element's position among its siblings. */
const STRUCTURAL = /(?:^|[\s:])(?:first|last|odd|even|only|nth-[^\s:]+|first-of-type|last-of-type|only-of-type|\[&:(?:first|last|only|nth)-[^\]]+\])(?=:)/
const PEER = /(?:^|\s)peer(?:\/[\w-]+)?(?=\s|$)/

export const usesStructure = (className: string | undefined) => !!className && STRUCTURAL.test(className)

/** Whether any direct child needs its index, or is a peer. */
export function scanChildren(children: React.ReactNode) {
  let structure = false
  let peer = false
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const cls = (child.props as AnyProps).className
    if (typeof cls !== "string") return
    structure ||= STRUCTURAL.test(cls)
    peer ||= PEER.test(cls)
  })
  return { structure, peer }
}

const isStyledType = (type: unknown) => !!type && (type as { __astraStyled?: boolean }).__astraStyled === true

/** Icons count as `svg` for `has-[svg]`. */
function isIconType(type: unknown): boolean {
  if (!type || typeof type === "string") return type === "svg"
  const t = type as { displayName?: string; name?: string; __astraIcon?: boolean }
  if (t.__astraIcon) return true
  const name = t.displayName ?? t.name ?? ""
  return /icon$|^svg|lucide/i.test(name)
}

/** Attrs of the JSX descendants, for `has-*`. Only elements written in JSX are visible. */
export function collectDescendants(children: React.ReactNode, out: Attrs[] = [], depth = 0): Attrs[] {
  React.Children.forEach(children, (child) => {
    if (out.length >= 64 || !React.isValidElement(child)) return
    const p = child.props as AnyProps
    const attrs: Attrs = {}
    for (const k in p) if (k.startsWith("data-") || k.startsWith("aria-")) attrs[k] = p[k]
    if (p.disabled === true) attrs["aria-disabled"] = true
    if (p.checked === true) attrs["aria-checked"] = true
    if (isIconType(child.type)) attrs.svg = true
    out.push(attrs)
    if (depth < 6 && p.children) collectDescendants(p.children, out, depth + 1)
  })
  return out
}

/** Content-box width: what container queries and grid tracks measure against. */
export function contentWidth(width: number, style: Record<string, unknown>) {
  const n = (...keys: string[]) => {
    for (const k of keys) if (typeof style[k] === "number") return style[k] as number
    return 0
  }
  return (
    width -
    n("paddingLeft", "paddingStart", "paddingHorizontal", "padding") -
    n("paddingRight", "paddingEnd", "paddingHorizontal", "padding") -
    n("borderLeftWidth", "borderStartWidth", "borderWidth") -
    n("borderRightWidth", "borderEndWidth", "borderWidth")
  )
}

/** Divide borders for a child that isn't last, as CSS's `> :not(:last-child)`. */
function divideStyle(d: NonNullable<Resolved["divide"]>) {
  const s: Record<string, unknown> = {}
  if (d.x) {
    const side = d.xReverse ? "Left" : "Right"
    s[`border${side}Width`] = d.x
    if (d.color) s[`border${side}Color`] = d.color
  }
  if (d.y) {
    const side = d.yReverse ? "Top" : "Bottom"
    s[`border${side}Width`] = d.y
    if (d.color) s[`border${side}Color`] = d.color
  }
  if (d.style) s.borderStyle = d.style
  return s
}

/**
 * Clones children with what they need from this parent: `*:` classes, sibling
 * position, divide borders, grid track width and the peer store.
 */
export function mapChildren(
  children: React.ReactNode,
  res: Resolved,
  opts: { index: boolean; peers?: PeerStore; colWidth?: number }
): React.ReactNode {
  const list = React.Children.toArray(children)
  const count = list.filter(React.isValidElement).length
  let i = 0
  return list.map((child) => {
    if (!React.isValidElement(child)) return child
    const index = i++
    const cp = child.props as AnyProps
    const extra: AnyProps = {}
    const inj: Injected = {}
    if (opts.index) {
      inj.index = index
      inj.count = count
    }
    if (res.divide && index < count - 1) inj.base = divideStyle(res.divide)
    if (res.grid && opts.colWidth !== undefined) inj.grid = { ...res.grid, colWidth: opts.colWidth }
    if (opts.peers) inj.peers = opts.peers
    if (res.childClass) extra.className = cp.className ? `${cp.className} ${res.childClass}` : res.childClass

    if (typeof child.type === "string") {
      // Host elements can't take the injected prop; give them plain styles.
    } else {
      extra[INJECTED] = inj
    }
    if (!isStyledType(child.type)) {
      // Components that aren't styled() get the parent-provided styles under their own.
      const base = { ...inj.base, ...(inj.grid && { width: inj.grid.colWidth }) }
      if (Object.keys(base).length) extra.style = [base, cp.style]
    }
    return React.cloneElement(child, extra)
  })
}

export function markStyled(component: object) {
  ;(component as { __astraStyled?: boolean }).__astraStyled = true
}
