import * as React from "react"
import { Code } from "@/components/code-block"
import { DocsPage } from "@/components/docs/docs-page"
import { H2, Li, P, Ul } from "@/components/docs/prose"
import { guides } from "@/lib/docs"

export default function ReactNative() {
  const page = guides[4]
  return (
    <DocsPage title={page.title} description={page.description}>
      <H2>Same API</H2>
      <P>
        Components keep shadcn's exports, props, variants and composition (
        <Code>{"<Dialog><DialogTrigger asChild>…"}</Code>), and their classes are copied from shadcn's source. Where
        React Native works differently, they follow React Native.
      </P>

      <H2>What changes</H2>
      <Ul>
        <Li>
          Text is <Code>Text</Code>. Components that are text on the web (CardTitle, DialogDescription…) render{" "}
          <Code>Text</Code>. Components that take string children (<Code>{"<Button>Save</Button>"}</Code>) wrap them for
          you, and text styles on a component apply to the text inside it.
        </Li>
        <Li>
          Events use React Native names: <Code>onPress</Code>, <Code>onChangeText</Code>, <Code>onValueChange</Code>,{" "}
          <Code>onCheckedChange</Code>.
        </Li>
        <Li>
          Icons come from lucide-react-native. Render them with <Code>Icon</Code>, which takes its size and color from the
          component it's in: <Code>{"<Button><Icon as={PlusIcon} /> Add</Button>"}</Code>.
        </Li>
        <Li>Components with hover: styles also get the matching active: style, since touch screens don't hover.</Li>
        <Li>Tooltips and hover cards open on long-press on touch screens.</Li>
        <Li>
          Web libraries are replaced with React Native implementations that keep shadcn's API: vaul (Drawer), cmdk
          (Command), embla (Carousel), react-day-picker (Calendar), recharts (Chart), react-resizable-panels (Resizable),
          sonner (Sonner) and input-otp (Input OTP).
        </Li>
      </Ul>
    </DocsPage>
  )
}
