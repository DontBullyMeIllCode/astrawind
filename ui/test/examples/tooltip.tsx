import * as React from "react"
import { View } from "@astrawind/css"
import { Button } from "@astrawind/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@astrawind/ui/tooltip"

export default function TooltipExample() {
  return (
    <TooltipProvider>
      <View className="flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover</Button>
          </TooltipTrigger>
          <TooltipContent>Add to library</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Bottom</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Below the trigger</TooltipContent>
        </Tooltip>
      </View>
    </TooltipProvider>
  )
}
