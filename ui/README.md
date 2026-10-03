# @astrawind/ui

[shadcn/ui](https://ui.shadcn.com) for React Native. The same components, with the same names,
props, variants and Tailwind classes, ported from shadcn's **new-york-v4** registry and styled by
[`@astrawind/css`](../css).

```tsx
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@astrawind/ui"

<Card className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Login to your account</CardTitle>
    <CardDescription>Enter your email below to login to your account</CardDescription>
  </CardHeader>
  <CardContent className="gap-2">
    <Label nativeID="email">Email</Label>
    <Input aria-labelledby="email" placeholder="m@example.com" />
    <Button className="w-full">Login</Button>
  </CardContent>
</Card>
```

## Install

```sh
npx expo install @astrawind/ui @astrawind/css lucide-react-native react-native-svg react-native-safe-area-context
```

`react-hook-form` is needed only for `Form`.

## Setup

Wrap your app in `ThemeProvider`. It applies shadcn's theme variables, light and dark mode, the
base text styles, and mounts the portal host that dialogs, menus, popovers and toasts render into.

```tsx
import { ThemeProvider } from "@astrawind/ui"
import { View } from "@astrawind/css"

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" baseColor="neutral">
      <View className="flex-1 bg-background">
        <Main />
      </View>
    </ThemeProvider>
  )
}
```

| Prop | |
| --- | --- |
| `defaultTheme` | `"light"`, `"dark"` or `"system"` (default). |
| `forcedTheme` | Forces light or dark regardless of the selection. |
| `baseColor` | shadcn's base colors: `neutral` (default), `stone`, `zinc`, `mauve`, `olive`, `mist`, `taupe`. |
| `themeColor` | shadcn's theme colors, layered over the base color: `blue`, `green`, `violet`, … |
| `radius` | `--radius`, e.g. `"0.5rem"`. |
| `cssVars` | Your own variables in shadcn's `{ theme, light, dark }` shape, e.g. `{ light: { primary: "oklch(…)" } }`. |
| `fonts` | Maps font families and weights to native font names (see `@astrawind/css`). |
| `value` | A complete `@astrawind/css` theme, instead of the options above. |
| `portalHost` | Set to `false` if you mount `PortalHost` from `@rn-primitives/portal` yourself. |

`useTheme()` works like `next-themes`: `{ theme, setTheme, resolvedTheme, systemTheme, themes }`.

## Components

Every component in shadcn's registry: Accordion, Alert, Alert Dialog, Aspect Ratio, Attachment,
Avatar, Badge, Breadcrumb, Bubble, Button, Button Group, Calendar, Card, Carousel, Chart,
Checkbox, Collapsible, Combobox, Command, Context Menu, Dialog, Direction, Drawer, Dropdown Menu,
Empty, Field, Form, Hover Card, Input, Input Group, Input OTP, Item, Kbd, Label, Marker, Menubar,
Message, Message Scroller, Native Select, Navigation Menu, Pagination, Popover, Progress, Radio
Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner,
Spinner, Switch, Table, Tabs, Textarea, Toggle, Toggle Group and Tooltip.

Import from the package root, or one component at a time:

```tsx
import { Button } from "@astrawind/ui/button"
```

### Differences from the web

The API and look are shadcn's. Where React Native works differently, the components follow it:

- **Text is `Text`.** Components that are text on the web (`CardTitle`, `DialogDescription`, …)
  render `Text`. Components that take string children (`<Button>Save</Button>`) wrap them for you.
  Text styles on a component (`text-sm text-muted-foreground`) apply to the text inside it.
- **Events** use React Native names: `onPress`, `onChangeText`, `onValueChange`, `onCheckedChange`.
- **Icons** come from `lucide-react-native`. Render them with `Icon`, which takes its size and
  color from the component it's in, like `[&_svg]:size-4` and `currentColor` do on the web:
  `<Button><Icon as={PlusIcon} /> Add</Button>`.
- **Press feedback.** Components with `hover:` styles also get the matching `active:` style, since
  touch screens don't hover.
- **Tooltips and hover cards** open on long-press on touch screens.
- **Web libraries are replaced** with React Native implementations that keep shadcn's API:
  `vaul` (Drawer), `cmdk` (Command), `embla-carousel` (Carousel), `react-day-picker` (Calendar),
  `recharts` (Chart), `react-resizable-panels` (Resizable), `sonner` (Sonner: import `toast` from
  `@astrawind/ui`) and `input-otp` (Input OTP). Each file documents what it supports.

### Beyond shadcn

- **Status colors.** The theme adds `info`, `success`, `warning` and `error` (each with a
  `-foreground`), as in daisyUI: `bg-success`, `text-warning`. They're styled like shadcn's
  `destructive` (white text, the color at 60% in dark mode), and `error` is `--destructive`.
  Override them with `cssVars` like any other variable.
- **`color`, `soft` and `dash`.** Button, Badge and Alert take a `color` (`primary`, `info`,
  `success`, `warning`, `error`) and daisyUI's `soft` and `dash` variants:
  `<Button variant="soft" color="success">`. The color also applies to the `default`, `outline`,
  `ghost` and `link` variants. Card takes `variant="dash"`: a dashed border without the shadow.

## Keeping up with shadcn

`upstream/` holds the new-york-v4 source each component is ported from, and `upstream/COMMIT`
the shadcn commit. To update:

```sh
pnpm sync          # refreshes upstream/ and the theme colors in src/generated/
git diff upstream  # what changed upstream; port those changes to src/components/
pnpm test
```

See [AUTHORING.md](./AUTHORING.md) for how components are ported.

## Development

```sh
pnpm test        # class audit (every class must resolve natively) + render test of each example
pnpm typecheck
pnpm build       # ESM + CommonJS + types in dist/
```

## License

MIT. Component designs and class names are from [shadcn/ui](https://github.com/shadcn-ui/ui) (MIT).
