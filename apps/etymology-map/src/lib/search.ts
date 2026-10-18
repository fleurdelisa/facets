import { languageName, WORDS } from "./etymology";

export interface SearchResult {
  /** Words to show on the wheel. */
  items: string[];
  /** Word to jump to, if any. */
  best: string | null;
  hint: string | null;
}

const ALL = WORDS.map((w) => w.word);

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

// Translations, native forms ahead of romanizations, so "chai" or "Wasser"
// finds its word.
const FORM_INDEX = [false, true].flatMap((roman) =>
  WORDS.flatMap((w) =>
    Object.values(w.forms).flatMap((f) => {
      const text = roman ? f.roman : f.native;
      return text ? [{ key: normalize(text), word: w.word, lang: f.lang, shown: f.native }] : [];
    }),
  ),
);

export function search(query: string): SearchResult {
  const q = normalize(query);
  if (!q) return { items: ALL, best: null, hint: null };

  const prefix = ALL.filter((w) => w.startsWith(q));
  const contains = ALL.filter((w) => !w.startsWith(q) && w.includes(q));
  if (prefix.length || contains.length) {
    const items = [...prefix, ...contains].sort();
    return {
      items,
      best: prefix[0] ?? contains[0],
      hint: `${items.length} match${items.length === 1 ? "" : "es"}`,
    };
  }

  const exact = FORM_INDEX.find((e) => e.key === q);
  const partial = q.length >= 3 ? FORM_INDEX.find((e) => e.key.startsWith(q)) : undefined;
  const hit = exact ?? partial;
  if (hit) {
    return {
      items: ALL,
      best: hit.word,
      hint: `“${hit.shown}” is ${languageName(hit.lang)} for ${hit.word}`,
    };
  }

  // Not in the dataset: park the wheel at the alphabetical neighbour.
  const neighbour = ALL.find((w) => w > q) ?? ALL[ALL.length - 1];
  return { items: ALL, best: neighbour, hint: `“${query.trim()}” isn't in the dataset yet` };
}
