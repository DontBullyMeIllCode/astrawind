import * as React from "react"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Input } from "@astrawind/ui/input"
import { Label } from "@astrawind/ui/label"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@astrawind/ui/popover"

const FIELDS = [
  ["width", "Width", "100%"],
  ["maxWidth", "Max. width", "300px"],
  ["height", "Height", "25px"],
  ["maxHeight", "Max. height", "none"],
] as const

export default function PopoverExample() {
  return (
    <PopoverAnchor className="flex-row gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Open popover</Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <View className="grid gap-4">
            <PopoverHeader>
              <PopoverTitle>Dimensions</PopoverTitle>
              <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
            </PopoverHeader>
            <View className="grid gap-2">
              {FIELDS.map(([id, label, value]) => (
                <View key={id} className="flex-row items-center gap-4">
                  <Label htmlFor={id} className="w-24">
                    {label}
                  </Label>
                  <Input nativeID={id} defaultValue={value} className="h-8 flex-1" />
                </View>
              ))}
            </View>
          </View>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Top</Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start">
          Plain text content.
        </PopoverContent>
      </Popover>
    </PopoverAnchor>
  )
}
