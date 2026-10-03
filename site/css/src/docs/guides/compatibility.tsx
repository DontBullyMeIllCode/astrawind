import * as React from "react"
import { Code } from "@/site/code"
import { H2, Li, P, Table, Ul } from "../prose"

export default function Compatibility() {
  return (
    <>
      <H2 first>Requirements</H2>
      <Table
        head={["", "Requirement"]}
        rows={[
          ["React", "19 or newer."],
          ["React Native", "0.78 or newer. Tested on 0.86 with Expo SDK 57."],
          [
            "Architecture",
            "The New Architecture, for boxShadow, filter, gradients, display: contents and blend modes. Other utilities work on either.",
          ],
          ["Tailwind", "Its theme is built in; tailwindcss isn't needed at runtime. This release matches Tailwind 4.3.3."],
        ]}
      />

      <H2>How web features map to native</H2>
      <Table
        head={["Feature", "On native"]}
        rows={[
          ["Text inheritance", "Text styles set on a View (text-sm text-zinc-500) apply to the text inside it, as in CSS."],
          ["dark:", "Follows colorScheme on the provider (\"light\", \"dark\" or \"system\")."],
          ["sm:, max-md:, min-[600px]:", "Window width. portrait:/landscape: use the window's orientation."],
          ["@container, @md:", "Containers measure their width with onLayout; queries match from the next frame."],
          ["hover:, active:, focus:", "Press, hover (pointer devices) and focus state."],
          ["group-*, peer-*", "Named or unnamed; a peer can be any sibling."],
          ["has-*", "Matches data-*, aria-*, checked, disabled and icons among the children written in JSX."],
          ["first:, last:, odd:, nth-*, divide-*, *:", "The parent tells each child its position."],
          ["grid-cols-N, col-span-N", "Emulated with wrapping flex rows sized after the first layout."],
          [
            "transition-*, duration-*, ease-*, delay-*",
            "Animates color, opacity, transform and size changes; respects the OS \"reduce motion\" setting.",
          ],
          ["animate-spin, -pulse, -ping, -bounce", "Native-driver animations."],
          ["shadow-*, ring-*, inset-shadow-*", "boxShadow."],
          ["drop-shadow-*", "A dropShadow filter on Android; a layer shadow on iOS."],
          ["text-shadow-*", "React Native's single text shadow (layers combined)."],
          ["bg-linear-*, bg-radial, from-*/via-*/to-*", "experimental_backgroundImage gradients."],
          ["placeholder:, selection:, [&_svg]:", "placeholderTextColor, selectionColor, and default icon size and color."],
          ["ios:, android:, web:, native:", "Platform variants (AstraWind additions)."],
        ]}
      />

      <H2>Limitations</H2>
      <Ul>
        <Li>
          Parent-provided features (<Code>first:</Code>/<Code>last:</Code>/<Code>nth-*</Code>, <Code>divide-*</Code>,
          grid columns, <Code>*:</Code> and <Code>peer-*</Code>) need the parent to be an AstraWind component.
        </Li>
        <Li>
          <Code>has-*</Code> only sees children written in JSX, not elements rendered inside other components.
        </Li>
        <Li>
          Grids support equal-width columns and column spans. Explicit rows, placement and templates like{" "}
          <Code>grid-cols-[1fr_auto]</Code> fall back to a single column.
        </Li>
        <Li>Transitions run in JavaScript, don't animate box shadows, and don't animate text color inherited from a parent.</Li>
        <Li>React Native implements most filter functions on Android only.</Li>
        <Li>Conic gradients have no native equivalent.</Li>
        <Li>
          <Code>ch</Code> is approximated as half an <Code>em</Code>.
        </Li>
      </Ul>
      <P>
        These have no native equivalent and are accepted without effect: <Code>before:</Code>/<Code>after:</Code> and
        other pseudo-elements, masks, backdrop filters, scroll snapping and scroll margins, floats, tables, columns,{" "}
        <Code>order</Code>, <Code>zoom</Code>, z-axis translation and scale, <Code>cursor-*</Code> and browser-only
        states. In development, AstraWind warns once for each class in your code that it can't apply; set{" "}
        <Code>warnUnsupported</Code> on the provider to change this.
      </P>
    </>
  )
}
