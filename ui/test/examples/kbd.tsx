import * as React from "react"
import { Text, View } from "@astrawind/css"
import { Kbd, KbdGroup } from "@astrawind/ui/kbd"

export default function KbdExample() {
  return (
    <View className="items-center gap-4">
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>⌥</Kbd>
        <Kbd>⌃</Kbd>
      </KbdGroup>
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Text>+</Text>
        <Kbd>B</Kbd>
      </KbdGroup>
      <View data-slot="tooltip-content" className="rounded-md bg-foreground px-3 py-1.5">
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </View>
    </View>
  )
}
