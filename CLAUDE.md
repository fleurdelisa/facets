# Facets

A pnpm + Turborepo monorepo of personal microapps.

- `apps/*`: one deployable Next.js app per folder (e.g. `skill-tree`, `portfolio`)
- `packages/*`: shared code (`@facets/ui`)
- `gallery/*/intention.md`: ideas for apps that aren't built yet

Run from the repo root: `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm build`.

## Working preferences

- **One branch per scope.** Don't mix unrelated work (e.g. a feature and repo tooling) on the same branch; start a new branch from `main` instead.
- **One commit per fix.** Keep separate changes in separate commits, even on the same branch.
- **Pull request descriptions** use this format (also in `.github/pull_request_template.md`):

  ```
  ## Summary
  ### Before
  ### Changes
  ### After
  ## Screenshots (if any)
  ```

- **No links to Claude sessions** (`claude.ai/code/...`) anywhere in this repo: not in commit messages, PR descriptions, comments, or files. This repo is public.
- **Verify before pushing:** run `pnpm lint` and `pnpm build` at the root and report the results.
