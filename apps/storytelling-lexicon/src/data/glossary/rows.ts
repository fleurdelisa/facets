import type { Layer } from "@/lib/types";
import type { SeedEntry } from "./schema";

// [slug, name, summary, tvtropes path, aliases]
export type Row = [string, string, string, string?, string[]?];

export function fromRows(layer: Layer, rows: Row[], extra: Partial<SeedEntry> = {}): SeedEntry[] {
  return rows.map(([slug, name, summary, tvtropes, aliases]) => ({
    slug,
    name,
    summary,
    layer,
    tvtropes,
    aliases,
    ...extra,
  }));
}
