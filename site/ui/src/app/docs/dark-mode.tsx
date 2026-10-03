import * as React from "react"
import { CodeBlock, Code } from "@/components/code-block"
import { DocsPage } from "@/components/docs/docs-page"
import { H2, P } from "@/components/docs/prose"
import { guides } from "@/lib/docs"

export default function DarkMode() {
  const page = guides[3]
  return (
    <DocsPage title={page.title} description={page.description}>
      <P>
        <Code>ThemeProvider</Code> follows the OS color scheme by default (<Code>defaultTheme="system"</Code>).{" "}
        <Code>useTheme()</Code> works like next-themes, which shadcn uses on the web.
      </P>

      <H2>Mode toggle</H2>
      <CodeBlock
        title="components/mode-toggle.tsx"
        code={`
import { MoonIcon, SunIcon } from "lucide-react-native"
import { useTheme } from "@astrawind/ui"
import { Button } from "@astrawind/ui/button"
import { Icon } from "@astrawind/ui/icon"

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      onPress={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Icon as={resolvedTheme === "dark" ? SunIcon : MoonIcon} />
    </Button>
  )
}
`}
      />

      <H2>Remembering the choice</H2>
      <P>
        Use <Code>onThemeChange</Code> to save the choice (e.g. with AsyncStorage or expo-secure-store) and pass it back as{" "}
        <Code>defaultTheme</Code> on the next launch. <Code>forcedTheme</Code> fixes a screen to light or dark.
      </P>

      <H2>Styling for dark mode</H2>
      <P>
        shadcn's variables switch automatically. For your own classes, use the <Code>dark:</Code> variant:{" "}
        <Code>{'className="bg-white dark:bg-zinc-900"'}</Code>.
      </P>
    </DocsPage>
  )
}
