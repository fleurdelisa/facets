# Commonplace

A personal commonplace book for quotes from books, podcasts, movies, TV, articles, speeches and songs.

- **Full CRUD** on quotes, each with source type, title, who said it, and where in it (page or timestamp)
- **Timestamps**: when each quote was added, and when it was last edited
- **“Why I love it” notes** on every quote
- **Related quotes**: each quote suggests others you've saved, with the reason (shared tags, same author or source, similar wording)
- Search, filter by type and tag, and a daily rotating "Today's quote"
- Web app (this folder) plus a native iOS app ([`../library-ios`](../library-ios)), sharing one API and database

## Run the web app

```bash
cd apps/library
cp .env.example .env.local   # set FACETS_API_TOKEN
npm install
npm run dev                  # http://localhost:3000
```

Quotes go in a local SQLite file at `data/library.db`. Leave `FACETS_API_TOKEN` unset to skip the login screen while developing.

```bash
npm test          # repository + related-quote tests
npm run typecheck
npm run lint
```

## Deploy (so your phone can reach it)

Deploy anywhere that runs Next.js, such as Vercel. Serverless hosts have no persistent disk, so use a hosted libSQL database such as [Turso](https://turso.tech) (free tier):

```
DATABASE_URL=libsql://<your-db>.turso.io
DATABASE_AUTH_TOKEN=<turso token>
FACETS_API_TOKEN=<long random string>
```

The table is created on first request. If you run the app on a machine with a real disk (a home server, Fly.io with a volume), the default `file:` URL is fine.

## API

Every request needs `Authorization: Bearer $FACETS_API_TOKEN` when a token is set.

| Method | Path | |
| --- | --- | --- |
| `GET` | `/api/quotes?q=&tag=&type=` | List quotes, newest first, with optional filters |
| `POST` | `/api/quotes` | Create. Body: `{ text, sourceType?, sourceTitle?, author?, location?, notes?, tags? }` |
| `GET` | `/api/quotes/:id` | Read one quote |
| `PATCH` | `/api/quotes/:id` | Update any subset of fields (bumps `updatedAt`) |
| `DELETE` | `/api/quotes/:id` | Delete |
| `GET` | `/api/quotes/:id/related?limit=5` | Suggested related quotes: `[{ quote, score, reasons }]` |
| `GET` | `/api/quotes/random` | Quote of the day (stable for each UTC day), for widgets |

`sourceType` is one of `book podcast movie tv article speech song other`. Tags are lowercased and de-duplicated.

Because it's plain HTTP + JSON, an iOS Shortcut can save a quote with a single "Get contents of URL" action (POST, JSON body, Authorization header). That also covers the NFC-sticker idea in `gallery/library/intention.md`.

## How related quotes work

`src/lib/related.ts` scores every other quote against the one you're viewing:

- **55%**: TF-IDF cosine similarity of quote text + notes + tags (stopwords removed, light stemming)
- **25%**: tag overlap (Jaccard)
- **12%**: same author/speaker
- **8%**: same source title

Anything below 0.08 is dropped. It runs in memory on each request, which is fine up to several thousand quotes. Better tags and notes give better suggestions.
