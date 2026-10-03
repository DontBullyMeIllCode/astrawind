# AstraWind

Tailwind CSS v4 for React Native.

| Package | |
| --- | --- |
| [`@astrawind/css`](./css) | The engine: `className` in, native styles out. |
| [`@astrawind/ui`](./ui) | shadcn/ui for React Native, styled with `@astrawind/css`. |

```sh
pnpm install
pnpm test
pnpm build
```

## Publishing

```sh
cd css             # or ui
npm version <patch|minor|major>
npm publish            # runs typecheck, tests and build first (prepublishOnly)
```

Scoped packages publish privately by default; `publishConfig.access` is set to `public`.
