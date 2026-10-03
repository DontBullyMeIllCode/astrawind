import * as React from "react"
import { Code, CodeBlock } from "@/site/code"
import { H2, Li, P, Ul } from "../prose"

export default function Runtime() {
  return (
    <>
      <H2 first>No build step</H2>
      <P>
        Tailwind on the web scans your source files for class names and generates a stylesheet. AstraWind doesn't need to:
        it parses classes when a component renders and resolves them to native styles, so there's nothing to detect, and
        class names can be built at runtime (<Code>{"`bg-${color}-500`"}</Code>) without a safelist.
      </P>

      <H2>How a className is resolved</H2>
      <Ul>
        <Li>The class is parsed into its variants, utility, value, modifier and important flag.</Li>
        <Li>Variants are checked against the element: its state, its parent's, the window, the color scheme and platform.</Li>
        <Li>
          The utility is evaluated with Tailwind's semantics: theme variables, <Code>var()</Code> and <Code>calc()</Code>,{" "}
          <Code>oklch()</Code> colors, and later shorthands overriding earlier longhands.
        </Li>
        <Li>Classes are ordered as Tailwind would order them, so the result doesn't depend on the order you write them.</Li>
      </Ul>
      <P>
        Results are cached by className and everything they depend on, so re-rendering with the same classes costs a map
        lookup.
      </P>

      <H2>Without React</H2>
      <P>
        <Code>@astrawind/css/core</Code> resolves classNames to style objects with no React or React Native dependency, e.g.
        for tests or tooling. The quick reference tables in these docs use it:
      </P>
      <CodeBlock
        lang="tsx"
        code={`
import { compileTheme, resolve } from "@astrawind/css/core"

const t = compileTheme({}, "light")
resolve("p-4 bg-red-500 rounded-lg", {
  getVar: t.getVar,
  breakpoints: t.breakpoints,
  rem: 16,
  em: 16,
  windowWidth: 390,
  windowHeight: 844,
  colorScheme: "light",
  platform: "ios",
  rtl: false,
  self: { attrs: {} },
  groups: {},
  ancestors: [],
}).style
// { padding: 16, backgroundColor: "rgba(251, 44, 54, 1)", borderRadius: 8 }
`}
      />
    </>
  )
}
