import * as React from "react"
import { CodeIcon } from "lucide-react-native"
import { View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import { Button } from "@astrawind/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@astrawind/ui/dialog"
import { Icon } from "@astrawind/ui/icon"
import { CodeBlock } from "@/components/code-block"
import type { ChartDoc } from "@/lib/charts"

/** A chart with a "View Code" button, like ui.shadcn.com's ChartDisplay. */
export function ChartDisplay({
  chart,
  component: Component,
  className,
}: {
  chart: ChartDoc
  component: React.ComponentType
  className?: string
}) {
  return (
    <View className={cn("relative", className)}>
      <Component />
      <View className="absolute top-3 right-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`View code for ${chart.id}`}>
              <Icon as={CodeIcon} />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85%] sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{chart.id}</DialogTitle>
            </DialogHeader>
            <CodeBlock code={chart.source} title={`${chart.id}.tsx`} maxHeight={520} />
          </DialogContent>
        </Dialog>
      </View>
    </View>
  )
}
