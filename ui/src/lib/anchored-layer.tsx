import * as React from "react"

export interface AnchoredLayerProps {
  children: React.ReactNode
}

/**
 * On web, lifts popup content that is rendered inside its trigger's item (rn-primitives'
 * navigation menu) into a layer above the page, placed where upstream's
 * `absolute top-full left-0` would put it. On native the popup is already portaled.
 */
export function AnchoredLayer({ children }: AnchoredLayerProps) {
  return <>{children}</>
}
