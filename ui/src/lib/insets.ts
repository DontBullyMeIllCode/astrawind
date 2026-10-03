import * as React from "react"
import { SafeAreaInsetsContext } from "react-native-safe-area-context"

export interface Insets {
  top: number
  right: number
  bottom: number
  left: number
}

const ZERO: Insets = { top: 0, right: 0, bottom: 0, left: 0 }

/**
 * Safe-area insets for edge-anchored overlays (sheet, drawer, sidebar, toasts).
 * Reads react-native-safe-area-context's provider and falls back to zero when
 * the app doesn't render a SafeAreaProvider.
 */
export function useInsets(): Insets {
  return React.useContext(SafeAreaInsetsContext) ?? ZERO
}
