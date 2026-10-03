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
runs its typecheck, tests and build first. It needs an `NPM_TOKEN` secret in the repo.

Scoped packages publish privately by default; `publishConfig.access` is set to `public`.
