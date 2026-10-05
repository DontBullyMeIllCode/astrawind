import * as React from "react"
import { Pressable, Text, TextInput } from "@astrawind/css"
import { Code, CodeBlock } from "@/site/code"
import { H2, H3, P, Preview, Table } from "../prose"

export default function States() {
  return (
    <>
      <H2 first>Press, hover, and focus</H2>
      <P>
        Prefix a class with a variant to apply it conditionally. <Code>Pressable</Code>, <Code>TouchableOpacity</Code> and{" "}
        <Code>TextInput</Code> track their own press, hover and focus state:
      </P>
      <Preview className="gap-4">
        <Pressable className="rounded-full bg-violet-500 px-5 py-2 transition hover:bg-violet-600 active:scale-95 active:bg-violet-700">
          <Text className="font-semibold text-white">Save changes</Text>
        </Pressable>
        <TextInput
          placeholder="Focus me"
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20 dark:border-gray-700"
        />
      </Preview>
      <CodeBlock
        lang="tsx"
        code={`
<Pressable className="rounded-full bg-violet-500 px-5 py-2 transition hover:bg-violet-600 active:scale-95 active:bg-violet-700">
  <Text className="font-semibold text-white">Save changes</Text>
</Pressable>
<TextInput
  placeholder="Focus me"
  className="rounded-lg border border-gray-300 px-3 py-2 placeholder:text-gray-400 focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20"
/>
`}
      />
      <P>
        <Code>hover:</Code> applies on pointer devices (web, iPad with a trackpad). On touch screens, use{" "}
        <Code>active:</Code> for press feedback.
      </P>

      <H2>Styling based on parent and sibling state</H2>
      <H3>Groups</H3>
      <P>
        Mark a parent with <Code>group</Code> and style children with <Code>group-*</Code> variants. Groups can be named
        (<Code>group/item</Code> and <Code>group-hover/item:</Code>):
      </P>
      <CodeBlock
        lang="tsx"
        code={`
<Pressable className="group rounded-lg p-4 active:bg-sky-500">
  <Text className="font-semibold text-gray-900 group-active:text-white">New project</Text>
  <Text className="text-gray-500 group-active:text-white">Create a new project from a template.</Text>
</Pressable>
`}
      />
      <H3>Peers</H3>
      <P>
        Mark a sibling with <Code>peer</Code> and use <Code>peer-*</Code> variants on the elements after it. On native a
        peer can be any sibling, not just a previous one.
      </P>
      <H3>Data and ARIA attributes</H3>
      <P>
        Props named <Code>data-*</Code> and <Code>aria-*</Code> drive <Code>data-[state=open]:</Code> and{" "}
        <Code>aria-checked:</Code> variants, which is how shadcn-style components are styled.
      </P>

      <H2>Supported variants</H2>
      <Table
        head={["Variant", "Matches"]}
        rows={[
          ["hover:, active:, focus:, focus-visible:, focus-within:", "Pointer hover, press and focus state."],
          ["disabled:, enabled:", "The disabled prop, aria-disabled, or editable={false}."],
          ["group-*, peer-*, in-*", "Parent, sibling and ancestor state."],
          ["has-*", "Children written in JSX with matching data-*, aria-* or state."],
          ["first:, last:, odd:, even:, nth-*", "Position among siblings (the parent must be an AstraWind component)."],
          ["data-*, aria-*", "The element's data-* and aria-* props."],
          ["placeholder:, selection:", "placeholderTextColor and selectionColor on TextInput."],
          ["dark:, motion-safe:, motion-reduce:", "Color scheme and the OS reduce motion setting."],
          ["ios:, android:, web:, native:", "The platform (AstraWind additions)."],
        ]}
      />
    </>
  )
}
