import * as React from "react"
import { Text, View } from "@astrawind/css"
import { ScrollArea, ScrollBar } from "@astrawind/ui/scroll-area"
import { Separator } from "@astrawind/ui/separator"

const tags = Array.from({ length: 50 }).map((_, i, a) => `v1.2.0-beta.${a.length - i}`)

const works = [
  { artist: "Ornella Binni", color: "bg-rose-300" },
  { artist: "Tom Byrom", color: "bg-sky-300" },
  { artist: "Vladimir Malyavko", color: "bg-amber-300" },
]

export default function ScrollAreaExample() {
  return (
    <View className="flex flex-col gap-6">
      <ScrollArea className="h-72 w-48 rounded-md border">
        <View className="p-4">
          <Text className="mb-4 text-sm leading-none font-medium">Tags</Text>
          {tags.map((tag) => (
            <React.Fragment key={tag}>
              <Text className="text-sm">{tag}</Text>
              <Separator className="my-2" />
            </React.Fragment>
          ))}
        </View>
      </ScrollArea>
      <ScrollArea className="w-96 rounded-md border whitespace-nowrap">
        <View className="flex w-max flex-row gap-4 p-4">
          {works.map((artwork) => (
            <View key={artwork.artist} className="shrink-0">
              <View className={`h-[200px] w-[150px] rounded-md ${artwork.color}`} />
              <Text className="pt-2 text-xs text-muted-foreground">
                Photo by <Text className="font-semibold text-foreground">{artwork.artist}</Text>
              </Text>
            </View>
          ))}
        </View>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </View>
  )
}
