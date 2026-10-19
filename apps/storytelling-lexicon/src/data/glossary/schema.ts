import type { Layer, RelationKind } from "@/lib/types";

// Seed format for the public glossary. Summaries are our own words; full
// descriptions for entries with a `tvtropes` path come from the importer.
export type SeedEntry = {
  slug: string;
  name: string;
  aliases?: string[];
  layer: Layer;
  family?: string;
  summary: string;
  description?: string;
  source?: string;
  sourceUrl?: string;
  // TV Tropes page path, e.g. "Main/ChekhovsGun".
  tvtropes?: string;
  // Arcs only: fortune over time, values in [-1, 1].
  arc?: number[];
};

export type SeedRelation = {
  from: string;
  to: string;
  kind: RelationKind;
  note?: string;
  position?: number;
  start?: number;
  end?: number;
};
