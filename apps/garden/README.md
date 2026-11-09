# Garden

The site at [fleurdelisa.dev](https://fleurdelisa.dev): a digital garden with a blog, a recipe box, experiments, and a map of every app in this repo.

It's a static Next.js export. Every page is built to HTML at build time from the Markdown in `content/`, so there is no server or database.

## Run it

From the repo root:

```bash
pnpm install
pnpm --filter garden dev     # http://localhost:3000
pnpm --filter garden build   # writes the static site to apps/garden/out
```

## Add things

- **Blog post or experiment:** add a Markdown file to `content/blog/` or `content/experiments/` with a `title` and `date` in its frontmatter. It's listed on its section page automatically.
- **Experiment with an interactive part:** add a component in `src/components/experiments/` and register it by slug in `src/components/ExperimentScene.tsx`.
- **Recipe:** use `/admin/add-recipe` to import one from a URL or write it by hand. Download the Markdown file into `content/recipes/`. Recipes use `## Ingredients` (optionally grouped with `###` headings) and `## Instructions`, where each step is written `1. Step 1: Header: first sentence` and followed by bullets.
- **App on the map:** edit `src/data/places.ts`. When an app goes live, change its `stage` to `"bloom"` and give it a `url`.

## Deploy (Cloudflare Pages)

| Setting | Value |
| --- | --- |
| Root directory | `apps/garden` |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Build output directory | `out` |
| Environment variable | `NODE_VERSION=22` |

`functions/api/parse-recipe.ts` runs as a Cloudflare Pages Function. It powers "Import" on the add-recipe page, because a browser can't read other sites' pages directly. Under `next dev` it isn't available, so importing shows an error and you fill the recipe in by hand.
