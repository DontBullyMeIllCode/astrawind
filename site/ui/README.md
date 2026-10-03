# astrawind/ui site

The website for [`@astrawind/ui`](../../ui), modeled on [ui.shadcn.com](https://ui.shadcn.com):
Home, Docs, Charts and Create. It's an Expo Router app built with `@astrawind/ui` itself, and runs
on the web, iOS and Android.

```sh
pnpm install           # from the repo root
pnpm --filter ui web   # http://localhost:8081
pnpm --filter ui gen   # regenerate src/generated/ after adding components, examples or charts
pnpm --filter ui test  # server-renders everything in src/registry/, light and dark
```

## Where things are

| | |
| --- | --- |
| `src/app/index.tsx` | Home: hero and the cards showcase (`src/registry/home/`). |
| `src/app/docs/` | Docs: guides, `components/index.tsx` and `components/[name].tsx` for each component. |
| `src/app/charts/[type].tsx` | Charts gallery, one page per chart type (`src/registry/charts/`). |
| `src/app/create.tsx` | Create: customize the theme and get the `ThemeProvider` code. |
| `src/lib/docs.ts` | The docs sidebar. |
| `scripts/gen-registry.mjs` | Builds `src/generated/` from the ui package and `src/registry/`. |

Component pages come from the ui package: the title, description and imports from shadcn's docs
(`ui/upstream/docs/`, vendored by `ui`'s `pnpm sync`), and the live preview and code from
`ui/test/examples/<name>.tsx`. The site uses `@astrawind/ui`'s source directly through its
`react-native` export condition, so changes to the components show up without a build.
