import * as React from "react"
import { CodeBlock, Code } from "@/components/code-block"
import { DocsPage } from "@/components/docs/docs-page"
import { H2, P } from "@/components/docs/prose"
import { guides } from "@/lib/docs"

export default function Installation() {
  const page = guides[1]
  return (
    <DocsPage title={page.title} description={page.description}>
      <H2>Install the packages</H2>
      <P>In an Expo or React Native app (React 19+, React Native 0.78+, the New Architecture):</P>
      <CodeBlock
        lang="sh"
        title="Terminal"
        code="npx expo install @astrawind/ui @astrawind/css lucide-react-native react-native-svg react-native-safe-area-context"
      />
      <P>
        <Code>react-hook-form</Code> is needed only for Form.
      </P>

      <H2>Add the provider</H2>
      <P>
        Wrap your app in <Code>ThemeProvider</Code>. It applies shadcn's theme variables, light and dark mode and the base
        text styles, and mounts the portal host that dialogs, menus, popovers and toasts render into.
      </P>
      <CodeBlock
        title="app/_layout.tsx"
        code={`
import { Slot } from "expo-router"
import { View } from "@astrawind/css"
import { ThemeProvider } from "@astrawind/ui"

export default function RootLayout() {
  return (
    <ThemeProvider defaultTheme="system" baseColor="neutral">
      <View className="flex-1 bg-background">
        <Slot />
      </View>
    </ThemeProvider>
  )
}
`}
      />

      <H2>Use a component</H2>
      <P>Import components from the package root, or one at a time:</P>
      <CodeBlock
        code={`
import { Button } from "@astrawind/ui/button"

export function Save() {
  return <Button onPress={() => save()}>Save changes</Button>
}
`}
      />
      <P>
        Style your own views with the same Tailwind classes, using <Code>View</Code>, <Code>Text</Code> and{" "}
        <Code>Pressable</Code> from <Code>@astrawind/css</Code>.
      </P>
    </DocsPage>
  )
}
