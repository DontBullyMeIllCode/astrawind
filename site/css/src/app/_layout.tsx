import * as React from "react"
import { Platform } from "react-native"
import { Slot } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context"
import { styled, type FontResolver } from "@astrawind/css"
import { ThemeProvider, useTheme } from "@astrawind/ui"
import { Header } from "@/site/header"
import { readTheme } from "@/site/theme-persistence"

const SafeAreaView = styled(RNSafeAreaView)

const MONO = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
})

/** System fonts, with a real monospace font for `font-mono` on each platform. */
const fonts: FontResolver = (family, weight, style) => ({
  fontFamily: family && /mono/i.test(family) ? MONO : Platform.OS === "web" ? family : undefined,
  fontWeight: weight,
  fontStyle: style,
})

/**
 * `text-link`: the theme color for text. The cyan theme's dark `primary` is a fill color,
 * too dark to read as text on the dark background; its `sidebar-primary` is the lighter shade.
 */
const cssVars = {
  theme: { "color-link": "var(--link)" },
  light: { link: "var(--primary)" },
  dark: { link: "var(--sidebar-primary)" },
}

function Shell() {
  const { resolvedTheme } = useTheme()
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      <Header />
      <Slot />
    </SafeAreaView>
  )
}

/** Restores the saved theme once mounted (static pages render with the default). */
function RestoreTheme() {
  const { setTheme } = useTheme()
  React.useEffect(() => {
    const saved = readTheme()
    if (saved) setTheme(saved)
  }, [setTheme])
  return null
}

export default function RootLayout() {
  return (
    <ThemeProvider defaultTheme="system" baseColor="mist" themeColor="cyan" fonts={fonts} cssVars={cssVars}>
      <RestoreTheme />
      <Shell />
    </ThemeProvider>
  )
}
