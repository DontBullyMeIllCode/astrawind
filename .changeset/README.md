# Changesets

Run `pnpm changeset` in a PR that changes `@astrawind/css` or `@astrawind/ui` to record the
version bump and a changelog line. On merge to `main`, the release workflow opens a
"Version packages" PR; merging that publishes to npm.
