import * as React from "react"
import { Code, CodeBlock } from "@/site/code"
import { H2, P } from "../prose"

export default function DarkMode() {
  return (
    <>
      <H2 first>Overview</H2>
      <P>
        Prefix a class with <Code>dark:</Code> to apply it in dark mode. The color scheme comes from the provider's{" "}
        <Code>colorScheme</Code>: <Code>"system"</Code> (the default) follows the OS, and <Code>"light"</Code> or{" "}
        <Code>"dark"</Code> force one.
      </P>
      <CodeBlock
        lang="tsx"
        code={`
<View className="rounded-lg bg-white px-6 py-8 shadow-xl ring ring-gray-900/5 dark:bg-gray-800">
  <Text className="text-base font-medium text-gray-900 dark:text-white">Writes upside-down</Text>
  <Text className="mt-2 text-sm text-gray-500 dark:text-gray-400">
    The Zero Gravity Pen can be used to write in any orientation.
  </Text>
</View>
`}
      />

      <H2>Toggling dark mode manually</H2>
      <P>Keep the user's choice in state and pass it to the provider:</P>
      <CodeBlock
        lang="tsx"
        code={`
const [scheme, setScheme] = useState<"light" | "dark" | "system">("system")

<AstraWindProvider colorScheme={scheme}>…</AstraWindProvider>
`}
      />

      <H2>Dark mode theme variables</H2>
      <P>
        Themes can set variables per scheme with <Code>light</Code> and <Code>dark</Code>, so a class like{" "}
        <Code>bg-surface</Code> changes with the scheme without a <Code>dark:</Code> variant:
      </P>
      <CodeBlock
        lang="tsx"
        code={`
const theme = {
  vars: { "color-surface": "var(--surface)" },
  light: { surface: "oklch(1 0 0)" },
  dark: { surface: "oklch(0.21 0.006 285.9)" },
}
`}
      />
    </>
  )
}
