import * as React from "react"
import { BoldIcon, BookmarkIcon, ItalicIcon, UnderlineIcon } from "lucide-react-native"
import { View } from "@astrawind/css"
import { Icon } from "@astrawind/ui/icon"
import { Toggle } from "@astrawind/ui/toggle"

export default function ToggleExample() {
  const [pressed, setPressed] = React.useState(false)
  return (
    <View className="flex flex-row flex-wrap items-center gap-2">
      <Toggle aria-label="Toggle bookmark" size="sm" variant="outline" pressed={pressed} onPressedChange={setPressed}>
        <Icon as={BookmarkIcon} />
        Bookmark
      </Toggle>
      <Toggle aria-label="Toggle bold" defaultPressed>
        <Icon as={BoldIcon} />
      </Toggle>
      <Toggle aria-label="Toggle italic" variant="outline" size="lg">
        <Icon as={ItalicIcon} />
      </Toggle>
      <Toggle aria-label="Toggle underline" disabled>
        <Icon as={UnderlineIcon} />
      </Toggle>
    </View>
  )
}
