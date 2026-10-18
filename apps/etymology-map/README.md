# Etymology Map

An interactive map of where the world's words come from. Pick a word on the
wheel (or search for it, in English or in any language in the dataset) and every
country shows its word for it, colored by the root it descends from.

```bash
pnpm install --ignore-workspace
pnpm dev
```

## How it works

- **Wheel** (`src/components/WordWheel.tsx`): words sorted alphabetically on a
  CSS 3D drum. Scroll, drag, click or use ↑ ↓ / PgUp / PgDn / Home / End.
- **Search** (`src/lib/search.ts`): filters the wheel and jumps to the closest
  match. If no English word matches, it looks the query up among translations
  ("chai" → tea). Unknown words park the wheel at their alphabetical neighbor.
- **Map** (`src/components/WorldMap.tsx`): d3-geo Natural Earth projection of
  `world-atlas` 110m countries, with d3-zoom pan and zoom. Labels are sized to
  each country and placed largest-first without overlaps, so zooming in reveals
  more of them.

## Data

| File | Contents |
| --- | --- |
| `src/data/groups.ts` | Root families (Latin, Greek, Sino-Tibetan, Sanskrit…) and their colors |
| `src/data/languages.ts` | Language names, scripts, regional variants |
| `src/data/countries.ts` | Country → language fallback chain, keyed by world-atlas name |
| `src/data/words-*.ts` | The curated words |

Each word lists its **etyma** (the source forms its translations descend
from), each tagged with a root group. Several etyma in one group become
shades of that group's color. For example, *tea* has Min Nan *tê*, Mandarin
*chá* and Persian *chāy*, all Sino-Tibetan reds.

Forms are written `"native|etymonId|romanization"`. Romanization is generated
automatically for Cyrillic, Greek, Georgian and Armenian, so it can be left
out there. Bosnian/Montenegrin (`sh`) is derived from Serbian unless given
explicitly.

To add a word, add an entry to one of the `words-*.ts` files. Leave a language
out rather than guessing: its countries show "no data yet", or fall back to
the next language in their chain.

Country language choices follow the predominant or official lingua franca;
several countries (e.g. Bhutan, Eritrea, North Macedonia, Rwanda) have no data
yet.
