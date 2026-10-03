# @astrawind/css

Tailwind CSS v4 for React Native. Write `className` the way you would on the web;
AstraWind resolves it to native styles at runtime, using Tailwind's own theme values.

```tsx
import { Pressable, Text, View } from "@astrawind/css"

<View className="flex-row items-center gap-3 rounded-xl bg-white p-4 shadow-md dark:bg-zinc-900">
  <Text className="text-lg font-semibold text-zinc-900 dark:text-white">Hello</Text>
  <Pressable className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 transition active:scale-95 active:bg-indigo-700">
    <Text className="font-medium text-white">Save</Text>
  </Pressable>
</View>
```

- **Every Tailwind class resolves.** The test suite runs every class and variant the installed
  Tailwind version generates (23,000+) and fails if any is unknown. Classes with no native
  equivalent (`cursor-*`, scroll snapping, masks, ...) are accepted as deliberate no-ops.
- **No build step.** No Babel plugin or CSS compilation: classes are parsed when they render, and
  the results are cached.
- **CSS semantics, not approximations.** Custom properties with `var()`, `calc()`, text styles that
  inherit, `oklch()` colors, later shorthands overriding longhands, `group-*`/`peer-*`/`has-*`,
  container queries and transitions.

## Requirements

| | |
| --- | --- |
| React | 19+ |
| React Native | 0.78+ (tested on 0.86 with Expo SDK 57) |
| Architecture | The New Architecture, for `boxShadow`, `filter`, gradients, `display: contents` and blend modes. Other utilities work on either. |
| Tailwind | Its theme is built in. `tailwindcss` isn't needed at runtime; this release matches Tailwind **4.3.3**. |

## Install

```sh
npm install @astrawind/css
```

## Setup

Wrap your app in `AstraWindProvider`. It works without a theme; pass one to add your own
tokens or dark mode values.

```tsx
import { AstraWindProvider, TextRoot } from "@astrawind/css"

export default function App() {
  return (
    <AstraWindProvider colorScheme="system">
      {/* Text styles here apply to all text below, like styles on <body>. */}
      <TextRoot className="text-base text-zinc-900 dark:text-zinc-100">
        <Main />
      </TextRoot>
    </AstraWindProvider>
  )
}
```

AstraWind exports className-ready versions of the core components: `View`, `Text`, `Pressable`,
`TouchableOpacity`, `TextInput`, `ScrollView`, `FlatList`, `SectionList`, `Image`,
`ImageBackground`, `KeyboardAvoidingView`, `ActivityIndicator` and `Switch`. Scroll views and
lists also take `contentContainerClassName` (and `columnWrapperClassName` on `FlatList`).

## Theming

A theme is a set of CSS variables, the same ones you'd put in Tailwind's `@theme`, without the
leading `--`:

```tsx
import { AstraWindProvider, type AstraWindTheme } from "@astrawind/css"

const theme: AstraWindTheme = {
  // Always applied. Extends or overrides Tailwind's defaults.
  vars: {
    "color-brand": "var(--brand)",
    "font-sans": "Inter",
    "radius-lg": "0.75rem",
  },
  // Applied in light or dark mode.
  light: { brand: "oklch(0.55 0.2 265)" },
  dark: { brand: "oklch(0.7 0.15 265)" },
}

<AstraWindProvider theme={theme} colorScheme="system">…</AstraWindProvider>
// className="bg-brand text-white rounded-lg"
```

| Option | |
| --- | --- |
| `vars`, `light`, `dark` | CSS variables. Colors can be any CSS color (`oklch`, `hsl`, hex, `color-mix()`). |
| `fonts` | `(family, weight, style) => style`: maps a CSS font family and weight to a native font name, since native fonts are usually registered per weight. |
| `rem` | Root font size in px. Defaults to 16. |
| `name`, `themeVariants` | A theme named `"brand"` enables `brand:` variants; list your other themes' names in `themeVariants` so their variants don't match. |
| `styles` | Style tokens: `cn-*` classes that expand to utility classes, ranked below plain utilities (like a component layer). |

If your theme defines `--color-border`, it becomes the default border color, as with the common
`* { border-color: var(--color-border) }` base style. Otherwise borders default to `currentColor`.

## Your own components

`styled()` adds `className` to any component:

```tsx
import { styled } from "@astrawind/css"
import { BlurView } from "expo-blur"
import { Circle } from "lucide-react-native"

const Blur = styled(BlurView)
const Icon = styled(Circle, { kind: "icon" }) // size-* and text-* become size and color props

<Blur className="absolute inset-0 rounded-2xl" />
<Icon className="size-5 text-indigo-500" />
```

| Option | |
| --- | --- |
| `kind` | `"view"` (default: text styles pass to descendant text), `"text"`, `"input"` (placeholder and selection colors become props), or `"icon"`. |
| `interactive` | Tracks press, hover and focus for `active:`, `hover:` and `focus:` (set for `Pressable` and `TextInput`). |
| `classNameProps` | Extra className props mapped to style props, e.g. `{ contentContainerClassName: "contentContainerStyle" }`. |
| `mapStyle` | Moves resolved styles to props for third-party components. |

Also exported:

- `useTw()` resolves a className in a component, e.g. for a prop that takes a style.
- `useCurrentColor()` returns the inherited text color, e.g. to tint a native control.
- `IconStyle` sets the default icon size and color for a subtree.
- The props `data-*` and `aria-*` drive `data-[state=open]:` and `aria-checked:` variants.

## How web features map to native

| Feature | On native |
| --- | --- |
| Text inheritance | Text styles set on a `View` (`text-sm text-zinc-500`) apply to the text inside it, as in CSS. |
| `dark:` | Follows `colorScheme` on the provider (`"light"`, `"dark"` or `"system"`). |
| `sm:`, `max-md:`, `min-[600px]:` | Window width. `portrait:`/`landscape:` use the window's orientation. |
| `@container`, `@md:` | Containers measure their width with `onLayout`; queries match from the next frame. |
| `hover:`, `active:`, `focus:` | Press, hover (pointer devices) and focus state. |
| `group-*`, `peer-*` | Named or unnamed; a peer can be any sibling. |
| `has-*` | Matches `data-*`, `aria-*`, `checked`, `disabled` and icons among the children written in JSX. |
| `first:`, `last:`, `odd:`, `nth-*`, `divide-*`, `*:` | The parent tells each child its position. |
| `grid-cols-N`, `col-span-N` | Emulated with wrapping flex rows sized after the first layout. |
| `transition-*`, `duration-*`, `ease-*`, `delay-*` | Animates color, opacity, transform and size changes; respects the OS "reduce motion" setting. |
| `animate-spin`, `-pulse`, `-ping`, `-bounce` | Native-driver animations. |
| `shadow-*`, `ring-*`, `inset-shadow-*` | `boxShadow`. |
| `drop-shadow-*` | A `dropShadow` filter on Android; a layer shadow on iOS. |
| `text-shadow-*` | React Native's single text shadow (layers combined). |
| `bg-linear-*`, `bg-radial`, `from-*/via-*/to-*` | `experimental_backgroundImage` gradients. |
| `placeholder:`, `selection:`, `[&_svg]:` | `placeholderTextColor`, `selectionColor`, and default icon size/color. |
| `ios:`, `android:`, `web:`, `native:` | Platform variants (AstraWind additions). |

## Limitations

- **Parent-provided features** (`first:`/`last:`/`nth-*`, `divide-*`, grid columns, `*:` and
  `peer-*`) need the parent to be an AstraWind component.
- **`has-*`** only sees children written in JSX, not elements rendered inside other components.
- **Grids** support equal-width columns and column spans. Explicit rows, placement and templates
  like `grid-cols-[1fr_auto]` fall back to a single column.
- **Transitions** run in JavaScript, don't animate box shadows, and don't animate text color
  inherited from a parent.
- **Filters:** React Native implements most filter functions on Android only.
- **Gradients:** conic gradients have no native equivalent.
- **Units:** `ch` is approximated as half an `em`.

These have no native equivalent and are accepted without effect: `before:`/`after:` and other
pseudo-elements, masks, backdrop filters, scroll snapping and scroll margins, floats, tables,
columns, `order`, `zoom`, z-axis translation and scale, `cursor-*` and browser-only states.

In development, AstraWind warns once for each class in your code that it can't apply (an unknown
utility or a variant with no native equivalent). Set `warnUnsupported` on the provider to change
this.

## Without React

`@astrawind/css/core` resolves classNames to style objects with no React or React Native
dependency, e.g. for tests or server-side tooling:

```ts
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
```

## Development

```sh
pnpm install
pnpm test        # unit tests + full Tailwind coverage audit
pnpm typecheck
pnpm build       # ESM + CommonJS + types in dist/
pnpm gen         # regenerate the built-in theme from the installed tailwindcss
```

To move to a new Tailwind version: update `tailwindcss` in `devDependencies`, run `pnpm gen`, then
`pnpm test`. The coverage test lists any new classes or variants that need support.

## License

MIT
