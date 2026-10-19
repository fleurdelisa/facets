import { z } from "zod";

export const SOURCE_TYPES = [
  "book",
  "podcast",
  "movie",
  "tv",
  "article",
  "speech",
  "song",
  "other",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const SOURCE_LABELS: Record<SourceType, string> = {
  book: "Book",
  podcast: "Podcast",
  movie: "Movie",
  tv: "TV",
  article: "Article",
  speech: "Speech",
  song: "Song",
  other: "Other",
};

export interface Quote {
  id: string;
  text: string;
  sourceType: SourceType;
  sourceTitle: string;
  author: string;
  /** Page, chapter, or media timestamp such as "p. 42" or "1:23:45". */
  location: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const tags = z
  .array(z.string())
  .transform((list) => [
    ...new Set(list.map((t) => t.trim().toLowerCase()).filter(Boolean)),
  ]);

export const quoteInput = z.object({
  text: z.string().trim().min(1, "Quote text is required").max(5000),
  sourceType: z.enum(SOURCE_TYPES).default("book"),
  sourceTitle: z.string().trim().max(300).default(""),
  author: z.string().trim().max(200).default(""),
  location: z.string().trim().max(100).default(""),
  notes: z.string().trim().max(10000).default(""),
  tags: tags.default([]),
});

export const quotePatch = quoteInput.partial();

export type QuoteInput = z.infer<typeof quoteInput>;
export type QuotePatch = z.infer<typeof quotePatch>;

export interface RelatedQuote {
  quote: Quote;
  score: number;
  reasons: string[];
}
