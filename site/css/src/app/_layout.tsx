import * as React from "react"
import { Platform } from "react-native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { AstraWindProvider, TextRoot, type AstraWindTheme, type FontResolver } from "@astrawind/css"
import { SchemeProvider } from "@/site/scheme"

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

const theme: AstraWindTheme = {
  vars: { "color-border": "var(--color-gray-200)" },
  dark: { "color-border": "var(--color-gray-800)" },
  fonts,
}

export default function RootLayout() {
  return (
    <SchemeProvider>
      {(scheme) => (
        <AstraWindProvider theme={theme} colorScheme={scheme}>
          <TextRoot className="font-sans text-base text-gray-950 dark:text-white">
            <StatusBar style={scheme === "dark" ? "light" : "dark"} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: scheme === "dark" ? "#030712" : "#ffffff" },
              }}
            />
          </TextRoot>
        </AstraWindProvider>
      )}
    </SchemeProvider>
  )
}
