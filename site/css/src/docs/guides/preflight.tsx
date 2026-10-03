import * as React from "react"
import { Code, CodeBlock } from "@/site/code"
import { TextLink } from "@/site/link"
import { H2, Li, P, Ul } from "../prose"

export default function Preflight() {
  return (
    <>
      <H2 first>Overview</H2>
      <P>
        On the web, Preflight resets browser defaults. React Native has no browser defaults to reset, so AstraWind's base
        styles are small, and match what Tailwind's reset gives you:
      </P>
      <Ul>
        <Li>
          Borders are solid and default to <Code>currentColor</Code>, or to <Code>--color-border</Code> when your theme
          defines it. <Code>border</Code> alone draws a one-point border.
        </Li>
        <Li>Text has no default margins; spacing comes from your classes.</Li>
        <Li>
          Font sizes and spacing use <Code>rem</Code> = 16 points (set <Code>rem</Code> in your theme to change it).
        </Li>
      </Ul>

      <H2>Text inheritance</H2>
      <P>
        In CSS, text styles inherit. AstraWind does the same: text styles set on a <Code>View</Code> (or on{" "}
        <Code>TextRoot</Code>) apply to every <Code>Text</Code> and icon inside it, unless a closer element overrides them.
      </P>
      <CodeBlock
        lang="tsx"
        code={`
<View className="text-sm text-zinc-500">
  <Text>Inherits text-sm text-zinc-500</Text>
  <Text className="text-zinc-900">Overrides the color</Text>
</View>
`}
      />
      <P>
        The inherited properties are color, font family, size, weight and style, line height, letter spacing, text
        alignment, transform and decoration, font variants and text shadows. See{" "}
        <TextLink href="/docs/hooks-and-components">TextRoot</TextLink> to set them for the whole app.
      </P>
    </>
  )
}
