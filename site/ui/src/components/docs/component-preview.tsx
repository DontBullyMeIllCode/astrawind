import * as React from "react"
import { Text, View } from "@astrawind/css"
import { cn } from "@astrawind/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@astrawind/ui/tabs"
import { CodeBlock } from "@/components/code-block"

/** Preview / Code tabs for an example, like ui.shadcn.com's ComponentPreview. */
export function ComponentPreview({
  component: Component,
  source,
  title,
  className,
}: {
  component?: React.ComponentType
  source?: string | null
  title?: string
  className?: string
}) {
  const [tab, setTab] = React.useState("preview")
  return (
    <Tabs value={tab} onValueChange={setTab} className="my-4 gap-4">
      <TabsList className="self-start">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
      <TabsContent value="preview">
        <View className={cn("min-h-[350px] items-center justify-center rounded-xl border p-6 md:p-10", className)}>
          {Component ? <Component /> : <Text className="text-sm text-muted-foreground">No preview.</Text>}
        </View>
      </TabsContent>
      <TabsContent value="code">
        {source ? <CodeBlock code={source} title={title} maxHeight={560} /> : null}
      </TabsContent>
    </Tabs>
  )
}
