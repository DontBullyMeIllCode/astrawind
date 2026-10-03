import { Platform } from "react-native"
import type { Theme } from "@astrawind/ui"

const KEY = "astrawind-scheme"

/** The saved light/dark/system choice (web only; native follows the OS until changed). */
export function readTheme(): Theme | undefined {
  if (Platform.OS !== "web") return undefined
  try {
    const v = globalThis.localStorage?.getItem(KEY)
    return v === "light" || v === "dark" || v === "system" ? v : undefined
  } catch {
    return undefined
  }
}

export function saveTheme(theme: Theme) {
  try {
    globalThis.localStorage?.setItem(KEY, theme)
  } catch {}
}
