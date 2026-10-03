import * as React from "react"
import { Code, CodeBlock } from "@/site/code"
import { H2, P, Table } from "../prose"

export default function ResponsiveDesign() {
  return (
    <>
      <H2 first>Overview</H2>
      <P>
        Breakpoint variants apply a class from a window width up. They match the window, which is the screen on phones and
        the browser window on the web:
      </P>
      <CodeBlock
        lang="tsx"
        code={`
<View className="flex-col gap-4 md:flex-row">
  <Image className="h-48 w-full rounded-lg md:h-auto md:w-48" source={{ uri }} />
  <View className="flex-1">…</View>
</View>
`}
      />
      <Table
        head={["Breakpoint", "Minimum width"]}
        rows={[
          ["sm", "40rem (640px)"],
          ["md", "48rem (768px)"],
          ["lg", "64rem (1024px)"],
          ["xl", "80rem (1280px)"],
          ["2xl", "96rem (1536px)"],
        ]}
      />
      <P>
        As in Tailwind, write the mobile style unprefixed and override it at larger sizes. Use <Code>max-md:</Code> to target
        only below a breakpoint, <Code>min-[600px]:</Code> for one-off sizes, and <Code>portrait:</Code> or{" "}
        <Code>landscape:</Code> for orientation. Custom breakpoints come from <Code>--breakpoint-*</Code> theme variables.
      </P>

      <H2>Container queries</H2>
      <P>
        Mark an element with <Code>@container</Code> and style its descendants by the container's width with{" "}
        <Code>@sm:</Code>, <Code>@md:</Code> and so on. Containers measure their width with <Code>onLayout</Code>, so
        queries match from the next frame:
      </P>
      <CodeBlock
        lang="tsx"
        code={`
<View className="@container">
  <View className="flex-col @md:flex-row">…</View>
</View>
`}
      />
    </>
  )
}
