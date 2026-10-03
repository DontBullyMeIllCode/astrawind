import * as React from "react"
import { Text } from "@astrawind/css"
import { Code } from "@/components/code-block"
import { DocsPage } from "@/components/docs/docs-page"
import { H2, Li, P, Ul } from "@/components/docs/prose"
import { BoxLink } from "@/components/link"
import { guides } from "@/lib/docs"

export default function Introduction() {
  const page = guides[0]
  return (
    <DocsPage title={page.title} description={page.description}>
      <P>
        <Code>@astrawind/ui</Code> is shadcn/ui for React Native: the same components, with the same names, props,
        variants and Tailwind classes, ported from shadcn's new-york-v4 registry. They're styled by{" "}
        <Code>@astrawind/css</Code>, which resolves Tailwind classes to native styles at runtime, so they look like
        shadcn/ui on iOS, Android and the web.
      </P>

      <H2>How it differs from shadcn/ui</H2>
      <P>
        shadcn/ui is code you copy into your project. <Code>@astrawind/ui</Code> is a package: you import components from
        it and theme them with CSS variables, the same variables shadcn writes to your CSS. The API is shadcn's; where
        React Native works differently (text, events, overlays), the components follow React Native.
      </P>
      <Ul>
        <Li>Every component in shadcn's registry, from Accordion to Tooltip, including Chart, Calendar, Carousel, Sidebar and Sonner.</Li>
        <Li>Built on @rn-primitives, the React Native port of Radix, for behavior and accessibility.</Li>
        <Li>Themed with shadcn's base colors and theme colors, in light and dark mode.</Li>
      </Ul>

      <H2>Where to next</H2>
      <P>Start with the installation guide, then browse the components.</P>
      <BoxLink href="/docs/installation" className="self-start">
        <Text className="font-medium underline underline-offset-4">Installation →</Text>
      </BoxLink>
    </DocsPage>
  )
}
