# Authoring @astrawind/ui components

Every component in `src/components/<name>.tsx` is a port of shadcn/ui's
**new-york-v4** component with the same name, vendored in `upstream/ui/<name>.tsx`
(`pnpm sync` refreshes it; `upstream/COMMIT` says from which commit). The goal is
**1:1: the same exports, the same props and variants, the same classes and the same
look**, on React Native, styled by `@astrawind/css`.

Reference components that show the conventions: `button.tsx`, `badge.tsx`,
`card.tsx`, `input.tsx`, `label.tsx`, `separator.tsx`.

## Rules

1. **Same API.** Export exactly what upstream exports, with the same names, in an
   `export { ... }` block at the bottom (types may be added). Variant and size props
   and their values match exactly, and so do sub-component names and composition
   (`<Dialog><DialogTrigger asChild>…`). Keep `asChild` where upstream has it
   (`@rn-primitives/slot`). Web-only props are dropped; DOM events become React Native
   ones (`onClick` → `onPress`, `onChange(e)` → `onChangeText`/`onValueChange`/`onCheckedChange`
   as the primitive does). Controlled/uncontrolled props (`open`/`defaultOpen`/`onOpenChange`,
   `value`/`defaultValue`/`onValueChange`) work as in Radix.
2. **Same classes.** Copy upstream's class strings verbatim, in the same order, including
   `data-slot` and the `data-*` attributes upstream sets (`data-variant`, `data-size`,
   `data-state`, `data-orientation`, `data-side`, `data-inset`, …). @astrawind/css resolves
   almost all of Tailwind, including `data-*:`, `aria-*:`, `group-*`, `peer-*`, `has-*`
   (on JSX children), `[&_svg]:size-4` (icon size), `dark:`, `md:`, `focus-visible:`,
   `transition-*` and `animate-*`. Only change what doesn't work natively (next rule),
   and leave a short comment when you do.
3. **Translate web-only selectors.** `pnpm test` fails on any class @astrawind/css can't
   apply (see `test/classes.test.ts`). Translate them to something that works and
   looks the same:
   - `[&>*:not(:first-child)]:…`, `first:`/`last:` of a *specific* child → compute from child
     index (`lib/position.tsx`: `withPositions` + `usePosition`) and add classes.
   - `[.border-b]:pb-6` → `hasClass(className, "border-b") && "pb-6"` (`lib/utils.ts`).
   - `[[data-slot=x]_&]:…`, `[&>[data-slot=x]]:…` → pass a prop or context from parent to child.
   - `before:`/`after:` pseudo-elements → real `View`s.
   - `hover:` states that matter on touch devices → add the matching `active:` class
     (`hover:bg-accent active:bg-accent`), as `button.tsx` does.
   - `[a&]:hover:*`, `file:*`, `[&_.recharts-*]`, `[cmdk-*]` → drop, or style the native element directly.
   - `grid` layouts that aren't equal columns → flex rows/columns.
   - `h-full` in rows → `self-stretch`; `inline-flex`, `w-fit` resolve as expected.
   Deliberate no-ops (`cursor-*`, `select-none`, `outline-none`, `whitespace-nowrap`,
   `transition-[color,box-shadow]`) are fine to keep: they don't warn.
4. **Text lives in `<Text>`.** Components that are text on the web (`CardTitle`,
   `DialogDescription`, `AlertTitle`, `TableHead`, …) render `Text` from `@astrawind/css`.
   Box components that take string children (`Button`, `Badge`, `CardContent`,
   `TableCell`, …) wrap them with `renderTextChildren(children)` (`lib/children.tsx`).
   Text styles on a box (`text-sm font-medium text-muted-foreground`) cascade to the
   `Text` and icons inside it, as CSS inheritance does; rely on that.
5. **Primitives.** Use `@astrawind/css` (`View`, `Text`, `Pressable`, `TextInput`, `ScrollView`,
   `styled()`, `IconStyle`, `useTw()`) and `@rn-primitives/*` for behavior and accessibility
   (the React Native port of Radix: dialog, alert-dialog, dropdown-menu, context-menu, menubar,
   select, popover, hover-card, tooltip, tabs, accordion, collapsible, checkbox, switch,
   radio-group, toggle, toggle-group, progress, avatar, aspect-ratio, label, separator,
   navigation-menu, slot, portal). Give primitive parts `className` with `styled(Primitive.X)`
   (`{ interactive: true }` for pressables, `{ kind: "text" }` for text).
   Overlays render into `@rn-primitives/portal` (`ThemeProvider` mounts the `PortalHost`).
   Where upstream uses a web library with no React Native build (`vaul`, `cmdk`,
   `embla-carousel`, `react-day-picker`, `recharts`, `react-resizable-panels`, `sonner`,
   `input-otp`), implement it with React Native primitives (`Animated`, `PanResponder`,
   `ScrollView`, `react-native-svg`, `date-fns`), keeping upstream's component API.
6. **Shared helpers** in `src/lib/`: `overlay.tsx` (presence and open animations,
   `CenteredOverlayLayout`, `OpenSync` for controlled rn-primitives roots, `withHighlight`,
   `LongPressAdapter`, `composeRefs`), `use-controllable-state.ts`, `position.tsx`,
   `insets.ts` (safe-area insets), `children.tsx`, `utils.ts`, `chart.tsx` (the chart
   context, `ChartContainer`, tooltip, legend and marker components that `chart.tsx` and
   `chart-polar.tsx` share, so `chart-polar` doesn't import `chart`, which re-exports it: Metro
   warns about require cycles). Reuse them; add new helpers
   in new files rather than editing shared ones, and never change their behavior.
7. **Icons.** `Icon` from `./icon` with icons from `lucide-react-native`, using the same
   icon names upstream imports from `lucide-react` (`ChevronDownIcon`, `XIcon`, …).
8. **Accessibility.** Set `role` and `aria-*` props (React Native supports `role`,
   `aria-label`, `aria-checked`, `aria-expanded`, `aria-selected`, `aria-disabled`,
   `aria-busy`, `aria-valuenow`, …). Keep upstream's `sr-only` text as `aria-label`s.
9. **Dependencies.** Don't add any beyond `package.json` without a strong reason; prefer
   React Native's `Animated` and `PanResponder` over gesture or animation libraries.
10. **Style.** Plain function components, `cn()` for classes, 2-space indentation, double
    quotes, no semicolons, like the reference components.
11. **`pointerEvents`.** Put `"none"` and `"auto"` in `style`. On a plain React Native
    component (`View`, `Animated.View`, `KeyboardAvoidingView` from `react-native`), pass
    `"box-none"` and `"box-only"` as the `pointerEvents` prop: they aren't CSS values, and
    react-native-web throws on them in an inline style. Components from `@astrawind/css`
    take any value in `style`.

## Prior art

`/Users/dontbullymeillcode/Projects/astra-ui/packages/native/src/components/` holds an
earlier React Native port of every one of these components, on the same primitives and
an older copy of the same styling engine (`astrawind`, now `@astrawind/css`). It is a good
reference for native mechanics (portals, positioning, gestures, keyboard handling), but
it is **not** new-york-v4: it uses `cn-*` theme tokens, `color` props, `soft` variants and
`@astra-ui/themes`. Don't copy those; the classes come from `upstream/ui/`.

## Checking your work

- `pnpm typecheck` passes.
- `pnpm test` passes: the class audit, and every example in `test/examples/<name>.tsx`
  renders in light and dark mode on react-native-web with no React errors.
- Each component has an example, `test/examples/<name>.tsx`, modeled on shadcn's demo
  for it (default export, no props), that exercises its variants and sub-components.
- `src/components/index.ts` exports every component.
