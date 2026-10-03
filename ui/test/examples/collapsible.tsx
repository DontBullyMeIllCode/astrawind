import * as React from "react"
import { ChevronsUpDownIcon } from "lucide-react-native"
import { Text, View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@astrawind/ui/collapsible"
import { Icon } from "@astrawind/ui/icon"

export default function CollapsibleExample() {
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <View className="flex flex-col gap-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="flex w-[350px] flex-col gap-2">
        <View className="flex items-center justify-between gap-4 px-4">
          <Text className="text-sm font-semibold">@peduarte starred 3 repositories</Text>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Toggle">
              <Icon as={ChevronsUpDownIcon} />
            </Button>
          </CollapsibleTrigger>
        </View>
        <View className="rounded-md border px-4 py-2 font-mono text-sm">
          <Text>@radix-ui/primitives</Text>
        </View>
        <CollapsibleContent className="flex flex-col gap-2">
          <View className="rounded-md border px-4 py-2 font-mono text-sm">
            <Text>@radix-ui/colors</Text>
          </View>
          <View className="rounded-md border px-4 py-2 font-mono text-sm">
            <Text>@stitches/react</Text>
          </View>
        </CollapsibleContent>
      </Collapsible>
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="text-sm">Can I use this in my project?</CollapsibleTrigger>
        <CollapsibleContent className="text-sm text-muted-foreground">
          Yes. Free to use for personal and commercial projects.
        </CollapsibleContent>
      </Collapsible>
    </View>
  )
}
