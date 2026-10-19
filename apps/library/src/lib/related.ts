import type { Quote, RelatedQuote } from "./types";

// prettier-ignore
const STOPWORDS = new Set(("a about above after again against all am an and any are as at be because been before being " +
  "below between both but by can could did do does doing down during each few for from further had has have having he " +
  "her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now " +
  "of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs " +
  "them themselves then there these they this those through to too under until up very was we were what when where " +
  "which while who whom why will with would you your yours yourself yourselves one also like get got let us").split(" "));

const WEIGHTS = { text: 0.55, tags: 0.25, author: 0.12, source: 0.08 };
const MIN_SCORE = 0.08;

/** Lowercased, stopword-free, lightly stemmed word tokens. */
export function tokenize(input: string): string[] {
  return (input.toLowerCase().match(/[a-z0-9']+/g) ?? [])
    .map((w) => w.replace(/'s$|'/g, ""))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map(stem);
}

function stem(word: string): string {
  for (const suffix of ["ingly", "edly", "ing", "ies", "ed", "ly", "es", "s"]) {
    if (word.length - suffix.length >= 4 && word.endsWith(suffix)) {
      return suffix === "ies" ? word.slice(0, -3) + "y" : word.slice(0, -suffix.length);
    }
  }
  return word;
}

function termCounts(tokens: string[]) {
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  return counts;
}

function cosine(a: Map<string, number>, b: Map<string, number>) {
  let dot = 0;
  for (const [term, weight] of a) dot += weight * (b.get(term) ?? 0);
  if (dot === 0) return 0;
  const norm = (v: Map<string, number>) => Math.sqrt([...v.values()].reduce((s, x) => s + x * x, 0));
  return dot / (norm(a) * norm(b));
}

const same = (a: string, b: string) => a.trim() !== "" && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Ranks the other quotes by how related they are to `target`, blending
 * TF-IDF similarity of the quote, notes and tags with shared tags, author and source.
 */
export function findRelated(target: Quote, corpus: Quote[], limit = 5): RelatedQuote[] {
  const doc = (q: Quote) => ({ quote: q, counts: termCounts(tokenize(`${q.text} ${q.notes} ${q.tags.join(" ")}`)) });
  const docs = corpus.map(doc);
  if (!docs.some((d) => d.quote.id === target.id)) docs.push(doc(target));

  const docFreq = new Map<string, number>();
  for (const { counts } of docs) for (const term of counts.keys()) docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
  const idf = (term: string) => Math.log(1 + docs.length / (docFreq.get(term) ?? 1));
  const vector = (counts: Map<string, number>) =>
    new Map([...counts].map(([term, n]) => [term, n * idf(term)] as [string, number]));

  const targetVec = vector(docs.find((d) => d.quote.id === target.id)!.counts);
  const targetTags = new Set(target.tags);

  return docs
    .filter((d) => d.quote.id !== target.id)
    .map(({ quote, counts }) => {
      const reasons: string[] = [];
      const shared = quote.tags.filter((t) => targetTags.has(t));
      const union = new Set([...quote.tags, ...target.tags]).size;
      const tagScore = union ? shared.length / union : 0;
      const textScore = cosine(targetVec, vector(counts));
      const sameAuthor = same(quote.author, target.author);
      const sameSource = same(quote.sourceTitle, target.sourceTitle);

      if (shared.length) reasons.push(`Shared tags: ${shared.map((t) => `#${t}`).join(", ")}`);
      if (sameAuthor) reasons.push(`Also by ${quote.author}`);
      if (sameSource) reasons.push(`Also from ${quote.sourceTitle}`);
      if (textScore >= 0.1) {
        const terms = [...counts.keys()].filter((t) => targetVec.has(t)).slice(0, 3);
        reasons.push(`Similar ideas: ${terms.join(", ")}`);
      }

      const score =
        WEIGHTS.text * textScore +
        WEIGHTS.tags * tagScore +
        WEIGHTS.author * Number(sameAuthor) +
        WEIGHTS.source * Number(sameSource);
      return { quote, score: Math.round(score * 1000) / 1000, reasons };
    })
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
