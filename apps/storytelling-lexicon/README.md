# Storytelling Lexicon

A glossary of storytelling concepts — master plots, emotional arcs, structures and their beats, archetypes, tropes, devices and motifs — with a private catalog for logging where you spot them.

- **Glossary** (public): 278 seed entries in `src/data/glossary`, cross-linked (broader/narrower, opposites, related, "often confused with", stages of a structure). Summaries are hand-written; fuller descriptions for the ~150 entries with a `tvtropes` path come from TV Tropes via the importer.
- **Catalog** (private, Supabase auth + row level security): works, sightings (entry + where + how it's played + note + spoiler flag), notes on entries, and your own custom entries.

Without Supabase env vars the app runs in **preview mode**: the glossary reads straight from the seed files and the catalog is off. Good for working on the UI.

```sh
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # seed-data integrity + TV Tropes extractor
```

## Setting up Supabase

1. Create a project at supabase.com.
2. Run `supabase/migrations/20261019000000_init.sql` in the SQL editor (or `supabase db push` with the CLI).
3. Seed the glossary — either `pnpm seed` with the env vars below, or `pnpm seed --sql > seed.sql` and paste that into the SQL editor. Re-running is safe; imported descriptions are kept.
4. **Auth → Providers → Email**: keep email enabled, and turn **off** "Allow new users to sign up".
5. **Auth → Users → Add user**: create yourself (your email). The sign-in form only works for existing users.
6. **Auth → URL Configuration**: set Site URL to your domain and add `https://<your-domain>/auth/callback` to redirect URLs (plus `http://localhost:3000/auth/callback` for local dev).
7. Copy `.env.example` to `.env.local` and fill it in.

## Importing TV Tropes descriptions

```sh
pnpm import:tvtropes --dry-run --only chekhovs-gun,the-underdog   # check extraction first
pnpm import:tvtropes                                               # all linked entries
```

It reads robots.txt, fetches one page at a time (3s apart or the site's crawl-delay), caches pages in `.cache/tvtropes`, keeps only the description (no examples), and stores the page URL and licence with each one. It reports any `tvtropes` paths that 404 — some were written from memory, so fix those in `src/data/glossary` and re-run.

## Deploying (Vercel)

New project → import the repo → **Root Directory** `apps/storytelling-lexicon`. Add the env vars (set `NEXT_PUBLIC_SITE_URL` to the production URL). Then add a domain, e.g. `lexicon.fleurdelisa.dev`, and create the CNAME record Vercel shows you at your DNS provider.

## Licences

Code: MIT (`LICENSE`). Glossary content — the seed data and imported descriptions — is CC BY-NC-SA 3.0 (`CONTENT-LICENSE.md`), because it includes TV Tropes material under that licence.
