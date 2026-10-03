import * as React from "react"
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react-native"
import { View } from "@astrawind/css"
import { Icon } from "@astrawind/ui/icon"
import { ToggleGroup, ToggleGroupItem } from "@astrawind/ui/toggle-group"

export default function ToggleGroupExample() {
  const [value, setValue] = React.useState("center")
  return (
    <View className="flex flex-col gap-4">
      <ToggleGroup variant="outline" type="multiple" defaultValue={["bold"]}>
        <ToggleGroupItem value="bold" aria-label="Toggle bold">
          <Icon as={BoldIcon} className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Toggle italic">
          <Icon as={ItalicIcon} className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
          <Icon as={UnderlineIcon} className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" size="sm" value={value} onValueChange={setValue}>
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" variant="outline" spacing={2} size="lg" disabled>
        <ToggleGroupItem value="top">Top</ToggleGroupItem>
        <ToggleGroupItem value="bottom">Bottom</ToggleGroupItem>
      </ToggleGroup>
    </View>
  )
}
