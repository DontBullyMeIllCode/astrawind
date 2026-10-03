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

| Site | |
| --- | --- |
| [`site/css`](./site/css) | Docs for `@astrawind/css`, at [www.astrawind.io](https://www.astrawind.io). |
| [`site/ui`](./site/ui) | Docs for `@astrawind/ui`, at [ui.astrawind.io](https://ui.astrawind.io). |

## CI and deploys

GitHub Actions run each package's typecheck and tests on pull requests and pushes to `main`:
`css.yml` for `css/` and `site/css/`, `ui.yml` for `ui/` and `site/ui/` (and for `css/`, which
`ui` depends on). Each site is its own Vercel project with its site folder as the Root
Directory; the build settings are in its `vercel.json`, and Vercel deploys a preview for every
pull request and production on merge to `main`.

## Publishing

Releases use [Changesets](https://github.com/changesets/changesets):

```sh
pnpm changeset   # in a PR that changes css/ or ui/: pick the packages, the bump and a changelog line
```

On merge to `main`, `release.yml` opens a "Version packages" PR that bumps the versions and
writes the changelogs. Merging that PR publishes to npm; each package's `prepublishOnly`
runs its typecheck, tests and build first. Publishing uses npm trusted publishing (no token):
each package lists this repo and `release.yml` as its trusted publisher on npmjs.com, and npm
adds provenance. Don't run `npm publish` locally: it skips provenance and leaves pnpm's
`workspace:` versions in the published `package.json`.

The repo uses pnpm 11 (`packageManager`); its settings (`allowBuilds`, `overrides`) are in
`pnpm-workspace.yaml`, since pnpm 11 no longer reads the `pnpm` field in `package.json`.

Scoped packages publish privately by default; `publishConfig.access` is set to `public`.
