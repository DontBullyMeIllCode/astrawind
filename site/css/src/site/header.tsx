import * as React from "react"
import { Pressable, Text, View } from "@astrawind/css"
import { BoxLink } from "./link"
import { useScheme, type SchemeSetting } from "./scheme"

const NEXT: Record<SchemeSetting, SchemeSetting> = { system: "light", light: "dark", dark: "system" }
const LABEL: Record<SchemeSetting, string> = { system: "System", light: "Light", dark: "Dark" }

function SchemeToggle() {
  const { setting, setSetting } = useScheme()
  return (
    <Pressable
      onPress={() => setSetting(NEXT[setting])}
      aria-label={`Color scheme: ${LABEL[setting]}`}
      className="rounded-full px-3 py-1 ring-1 ring-gray-950/10 hover:bg-gray-950/5 active:bg-gray-950/5 dark:ring-white/10 dark:hover:bg-white/5"
    >
      <Text className="text-xs/5 font-medium text-gray-700 dark:text-gray-300">{LABEL[setting]}</Text>
    </Pressable>
  )
}

export function Logo() {
  return (
    <BoxLink href="/" className="flex-row items-center gap-2" aria-label="AstraWind home">
      <View className="size-6 items-center justify-center rounded-md bg-sky-500">
        <Text className="text-sm font-bold text-white">A</Text>
      </View>
      <Text className="text-base font-semibold tracking-tight text-gray-950 dark:text-white">AstraWind</Text>
    </BoxLink>
  )
}

/** The top bar: logo, links and the color scheme toggle. `menu` renders the mobile nav button. */
export function Header({ version, menu }: { version: string; menu?: React.ReactNode }) {
  return (
    <View className="h-14 flex-row items-center gap-4 border-b border-gray-950/5 bg-white/90 px-4 sm:px-6 dark:border-white/10 dark:bg-gray-950/90">
      {menu}
      <Logo />
      <View className="rounded-full bg-gray-950/5 px-2 py-0.5 dark:bg-white/10">
        <Text className="font-mono text-xs font-medium text-gray-700 dark:text-gray-300">v{version}</Text>
      </View>
      <View className="flex-1" />
      <BoxLink href="/docs/installation" className="max-sm:hidden">
        <Text className="text-sm font-medium text-gray-950 hover:text-sky-600 dark:text-white dark:hover:text-sky-400">Docs</Text>
      </BoxLink>
      <SchemeToggle />
    </View>
  )
}
