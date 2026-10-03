import * as React from "react"
import { Text, View } from "@astrawind/css"
import { DocsPage } from "@/components/docs/docs-page"
import { BoxLink } from "@/components/link"
import { componentDocs } from "@/lib/docs"

/** Every component, like ui.shadcn.com/docs/components. */
export default function ComponentsIndex() {
  return (
    <DocsPage title="Components" description="Here you can find all the components available in the library.">
      <View className="mt-4 flex-row flex-wrap gap-x-8 gap-y-3">
        {componentDocs.map((c) => (
          <BoxLink key={c.name} href={`/docs/components/${c.name}`} className="w-40">
            <Text className="text-lg font-medium underline-offset-4 hover:underline">{c.title}</Text>
          </BoxLink>
        ))}
      </View>
    </DocsPage>
  )
}
