import * as React from "react"
import { createPortal } from "react-dom"
import { View } from "react-native"
import type { AnchoredLayerProps } from "./anchored-layer"

export type { AnchoredLayerProps }

// The package is typed without the DOM lib.
interface Listeners {
  addEventListener(type: string, listener: () => void, capture?: boolean): void
  removeEventListener(type: string, listener: () => void, capture?: boolean): void
}
const dom = globalThis as unknown as { window?: Listeners; document?: { body: Element } }

/**
 * react-native-web gives every View `z-index: 0`, so an absolutely positioned popup can't
 * rise above content later in the page. The popup is portaled to `document.body` instead
 * (React context carries through the portal), and kept at a zero-size anchor below its item.
 */
export function AnchoredLayer({ children }: AnchoredLayerProps) {
  const anchor = React.useRef<View>(null)
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null)

  const update = React.useCallback(() => {
    const node = anchor.current as unknown as { getBoundingClientRect(): { top: number; left: number } } | null
    if (!node) return
    const rect = node.getBoundingClientRect()
    setPos((p) => (p && p.top === rect.top && p.left === rect.left ? p : { top: rect.top, left: rect.left }))
  }, [])
  // Every render: the item may have moved since (content opening elsewhere, layout changes).
  React.useLayoutEffect(update)
  React.useLayoutEffect(() => {
    const win = dom.window
    win?.addEventListener("scroll", update, true)
    win?.addEventListener("resize", update)
    return () => {
      win?.removeEventListener("scroll", update, true)
      win?.removeEventListener("resize", update)
    }
  }, [update])

  return (
    <>
      <View ref={anchor} style={{ position: "absolute", pointerEvents: "none", top: "100%", left: 0, width: 0, height: 0 }} />
      {pos &&
        dom.document &&
        createPortal(
          <View style={{ position: "fixed" as "absolute", top: pos.top, left: pos.left, zIndex: 50 }}>{children}</View>,
          dom.document.body
        )}
    </>
  )
}
