import * as React from "react"
import { useLocalSearchParams } from "expo-router"
import { CodeBlock, Code } from "@/components/code-block"
import { ComponentPreview } from "@/components/docs/component-preview"
import { DocsPage } from "@/components/docs/docs-page"
import { H2, H3, P } from "@/components/docs/prose"
import { examples, extraExamples } from "@/generated/previews"
import { componentDocs } from "@/lib/docs"

export async function generateStaticParams(): Promise<{ name: string }[]> {
  return componentDocs.map((c) => ({ name: c.name }))
}

export default function ComponentPage() {
  const { name } = useLocalSearchParams<{ name: string }>()
  const doc = componentDocs.find((c) => c.name === name)
  if (!doc) return <DocsPage title="Not found" description="There's no component with this name." />
  return (
    <DocsPage title={doc.title} description={doc.description}>
      <ComponentPreview component={examples[doc.name]} source={doc.example} title={`${doc.name}-demo.tsx`} />

      <H2>Installation</H2>
      <P>
        Every component ships in <Code>@astrawind/ui</Code>. If you haven't set it up, follow the installation guide, then
        import the component:
      </P>
      <CodeBlock lang="sh" title="Terminal" code="npx expo install @astrawind/ui @astrawind/css lucide-react-native react-native-svg" />

      <H2>Usage</H2>
      {doc.imports.map((code, i) => (
        <CodeBlock key={i} code={code} className="mb-4" />
      ))}
      <P>See the Code tab above for a complete example.</P>

      {doc.extras.length > 0 && <H2>Examples</H2>}
      {doc.extras.map((extra) => (
        <React.Fragment key={extra.slug}>
          <H3>{extra.title}</H3>
          <ComponentPreview
            component={extraExamples[`${doc.name}.${extra.slug}`]}
            source={extra.source}
            title={`${doc.name}-${extra.slug}.tsx`}
          />
        </React.Fragment>
      ))}
    </DocsPage>
  )
}
