import * as React from "react"
import { Keyboard, Platform } from "react-native"

/**
 * Height of the on-screen keyboard (0 when hidden), for edge-anchored overlays
 * (bottom sheet, drawer) that lift their content above it. On Android with
 * `adjustResize` the window already shrinks, so it stays 0 there.
 */
export function useKeyboardHeight(enabled = true): number {
  const [height, setHeight] = React.useState(0)
  React.useEffect(() => {
    if (!enabled || Platform.OS !== "ios") return
    const show = Keyboard.addListener("keyboardWillShow", (e) => setHeight(e.endCoordinates.height))
    const hide = Keyboard.addListener("keyboardWillHide", () => setHeight(0))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [enabled])
  return height
}
