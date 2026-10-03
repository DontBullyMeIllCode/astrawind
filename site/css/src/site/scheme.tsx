import * as React from "react"
import { Platform, useColorScheme } from "react-native"

export type SchemeSetting = "system" | "light" | "dark"

interface SchemeContextValue {
  setting: SchemeSetting
  setSetting: (setting: SchemeSetting) => void
  scheme: "light" | "dark"
}

const SchemeContext = React.createContext<SchemeContextValue>({
  setting: "system",
  setSetting: () => {},
  scheme: "light",
})

const KEY = "astrawind-scheme"

function readStored(): SchemeSetting {
  if (Platform.OS !== "web") return "system"
  try {
    const v = globalThis.localStorage?.getItem(KEY)
    return v === "light" || v === "dark" ? v : "system"
  } catch {
    return "system"
  }
}

/** Light, dark or system color scheme for the site, remembered in the browser. */
export function SchemeProvider({ children }: { children: (scheme: "light" | "dark") => React.ReactNode }) {
  const system = useColorScheme() === "dark" ? "dark" : "light"
  const [setting, setSettingState] = React.useState<SchemeSetting>("system")
  // Read after mount: static pages are rendered without storage.
  React.useEffect(() => setSettingState(readStored()), [])
  const setSetting = React.useCallback((next: SchemeSetting) => {
    setSettingState(next)
    try {
      if (next === "system") globalThis.localStorage?.removeItem(KEY)
      else globalThis.localStorage?.setItem(KEY, next)
    } catch {}
  }, [])
  const scheme = setting === "system" ? system : setting
  const value = React.useMemo(() => ({ setting, setSetting, scheme }), [setting, setSetting, scheme])
  return <SchemeContext.Provider value={value}>{children(scheme)}</SchemeContext.Provider>
}

export const useScheme = () => React.useContext(SchemeContext)
