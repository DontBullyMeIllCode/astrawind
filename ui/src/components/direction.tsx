import * as React from "react"
import { I18nManager } from "react-native"

type Direction = "ltr" | "rtl"

const DirectionContext = React.createContext<Direction | undefined>(undefined)

/**
 * Radix's DirectionProvider: sets the reading direction for components below it.
 * Takes `dir` (Radix's prop) or `direction`.
 */
function DirectionProvider({
  dir,
  direction,
  children,
}: {
  dir?: Direction
  direction?: Direction
  children?: React.ReactNode
}) {
  return <DirectionContext.Provider value={direction ?? dir}>{children}</DirectionContext.Provider>
}

/**
 * Radix's useDirection: the local direction if given, else the provider's, else
 * the platform's (`I18nManager.isRTL`; Radix falls back to "ltr").
 */
function useDirection(localDir?: Direction): Direction {
  const globalDir = React.useContext(DirectionContext)
  return localDir ?? globalDir ?? (I18nManager.isRTL ? "rtl" : "ltr")
}

export { DirectionProvider, useDirection, type Direction }
