# AstraWind docs

The website for [`@astrawind/css`](../../css): a landing page and docs laid out like
[tailwindcss.com/docs](https://tailwindcss.com/docs). It's an Expo Router app, styled with
AstraWind itself, and runs on the web, iOS and Android.

```sh
pnpm install          # from the repo root
pnpm --filter css web # http://localhost:8081
pnpm --filter css gen # regenerate the utility tables and badges (after a Tailwind or engine change)
npx expo export -p web  # static site in dist/
```

## Where things are

| | |
| --- | --- |
| `src/app/index.tsx` | Landing page. |
| `src/app/docs/_layout.tsx` | Docs shell: header, sidebar, page, "On this page". |
| `src/app/docs/[slug].tsx` | Every docs page, at `/docs/<slug>` (statically rendered). |
| `src/docs/nav.ts` | The navigation: sections, pages, and which CSS properties each utility page documents. |
| `src/docs/guides/` | Hand-written pages (Getting started, Core concepts, Base styles). |
| `src/generated/utilities.json` | Each utility page's classes and CSS, from `scripts/gen-docs.mjs`. |

Utility pages are generated: `gen-docs.mjs` asks the installed Tailwind for every class and its
CSS, and files each class under the pages whose properties it sets. The "React Native" column is
resolved live by `@astrawind/css` in the browser, so it always shows what the current version does.
The sidebar badges count each page's classes that have a native effect; they're computed by
`gen-docs.mjs` with the built `@astrawind/css`, so run `pnpm gen` again after changing the engine.

To add a page, add it to `nav.ts`; for a guide, also add its component to `src/docs/guides/index.ts`.
