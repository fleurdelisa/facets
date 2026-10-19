import "server-only";
import { seedEntries, seedRelations } from "@/data/glossary";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";
import type { Entry, EntryRelation, Layer, RelationKind } from "./types";

export type Related = {
  kind: RelationKind;
  // "out": this entry is the relation's `from`; "in": it's the `to`.
  direction: "out" | "in";
  note: string | null;
  position: number | null;
  story_start: number | null;
  story_end: number | null;
  entry: Entry;
};

export type StructureWithBeats = {
  structure: Entry;
  beats: (Entry & { position: number; story_start: number; story_end: number })[];
};

const byName = (a: Entry, b: Entry) => a.name.localeCompare(b.name);

// Preview mode: the bundled seed data, shaped like database rows -----------

const preview = (() => {
  let cache: { entries: Entry[]; relations: EntryRelation[]; bySlug: Map<string, Entry> } | null = null;
  return () => {
    if (cache) return cache;
    const entries: Entry[] = seedEntries.map((s) => ({
      id: s.slug,
      slug: s.slug,
      name: s.name,
      aliases: s.aliases ?? [],
      layer: s.layer,
      family: s.family ?? null,
      summary: s.summary,
      source_name: s.source ?? null,
      source_url: s.sourceUrl ?? null,
      description: s.description ?? null,
      description_source: null,
      description_url: null,
      description_license: null,
      tvtropes: s.tvtropes ?? null,
      arc_points: s.arc ?? null,
      owner_id: null,
    }));
    const relations: EntryRelation[] = seedRelations.map((r) => ({
      from_id: r.from,
      to_id: r.to,
      kind: r.kind,
      note: r.note ?? null,
      position: r.position ?? null,
      story_start: r.start ?? null,
      story_end: r.end ?? null,
    }));
    cache = { entries, relations, bySlug: new Map(entries.map((e) => [e.slug, e])) };
    return cache;
  };
})();

function previewSearch(q: string, limit: number): Entry[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const scored = preview()
    .entries.map((e) => {
      const name = e.name.toLowerCase();
      const hay = [name, ...e.aliases.map((a) => a.toLowerCase()), e.summary.toLowerCase()];
      const score =
        name.replace(/^the /, "") === needle.replace(/^the /, "") ? 4
        : name.includes(needle) ? 3
        : e.aliases.some((a) => a.toLowerCase().includes(needle)) ? 2
        : hay.some((h) => h.includes(needle)) ? 1
        : 0;
      return { e, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || byName(a.e, b.e));
  return scored.slice(0, limit).map((s) => s.e);
}

// Queries ---------------------------------------------------------------------

export async function listEntries(layer?: Layer): Promise<Entry[]> {
  if (!isSupabaseConfigured) {
    return preview()
      .entries.filter((e) => !layer || e.layer === layer)
      .sort(byName);
  }
  const supabase = await createClient();
  let query = supabase.from("entries").select("*").order("name");
  if (layer) query = query.eq("layer", layer);
  const { data, error } = await query;
  if (error) throw error;
  return data as Entry[];
}

export async function countByLayer(): Promise<Record<Layer, number>> {
  const entries = await listEntries();
  const counts = {} as Record<Layer, number>;
  for (const e of entries) counts[e.layer] = (counts[e.layer] ?? 0) + 1;
  return counts;
}

export async function searchEntries(q: string, limit = 20): Promise<Entry[]> {
  if (!isSupabaseConfigured) return previewSearch(q, limit);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_entries", { q: q.trim(), max_results: limit });
  if (error) throw error;
  return data as Entry[];
}

export async function getEntry(slug: string): Promise<{ entry: Entry; related: Related[] } | null> {
  if (!isSupabaseConfigured) {
    const { bySlug, relations } = preview();
    const entry = bySlug.get(slug);
    if (!entry) return null;
    const related: Related[] = relations.flatMap((r): Related[] => {
      if (r.from_id === slug) return [{ ...r, direction: "out", entry: bySlug.get(r.to_id)! }];
      if (r.to_id === slug) return [{ ...r, direction: "in", entry: bySlug.get(r.from_id)! }];
      return [];
    });
    return { entry, related };
  }

  const supabase = await createClient();
  // Glossary first if a custom entry happens to share the slug.
  const { data: rows, error } = await supabase
    .from("entries")
    .select("*")
    .eq("slug", slug)
    .order("owner_id", { ascending: true, nullsFirst: true })
    .limit(1);
  if (error) throw error;
  const entry = rows?.[0] as Entry | undefined;
  if (!entry) return null;

  const [outgoing, incoming] = await Promise.all([
    supabase.from("entry_relations").select("*, other:entries!entry_relations_to_id_fkey(*)").eq("from_id", entry.id),
    supabase.from("entry_relations").select("*, other:entries!entry_relations_from_id_fkey(*)").eq("to_id", entry.id),
  ]);
  if (outgoing.error) throw outgoing.error;
  if (incoming.error) throw incoming.error;

  type Row = EntryRelation & { other: Entry | null };
  const toRelated = (rows: Row[], direction: Related["direction"]): Related[] =>
    rows.filter((r) => r.other).map(({ other, ...r }) => ({ ...r, direction, entry: other! }));

  return {
    entry,
    related: [...toRelated(outgoing.data as Row[], "out"), ...toRelated(incoming.data as Row[], "in")],
  };
}

export async function listStructures(): Promise<StructureWithBeats[]> {
  let structures: Entry[];
  let stages: (EntryRelation & { beat: Entry })[];

  if (!isSupabaseConfigured) {
    const { entries, relations, bySlug } = preview();
    structures = entries.filter((e) => e.layer === "structure");
    stages = relations.filter((r) => r.kind === "stage_of").map((r) => ({ ...r, beat: bySlug.get(r.from_id)! }));
  } else {
    const supabase = await createClient();
    const [s, r] = await Promise.all([
      supabase.from("entries").select("*").eq("layer", "structure"),
      supabase
        .from("entry_relations")
        .select("*, beat:entries!entry_relations_from_id_fkey(*)")
        .eq("kind", "stage_of"),
    ]);
    if (s.error) throw s.error;
    if (r.error) throw r.error;
    structures = s.data as Entry[];
    stages = (r.data as (EntryRelation & { beat: Entry | null })[]).filter((x) => x.beat) as typeof stages;
  }

  return structures
    .map((structure) => ({
      structure,
      beats: stages
        .filter((st) => st.to_id === structure.id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((st) => ({
          ...st.beat,
          position: st.position ?? 0,
          story_start: st.story_start ?? 0,
          story_end: st.story_end ?? 0,
        })),
    }))
    .sort((a, b) => seedOrder(a.structure.slug) - seedOrder(b.structure.slug));
}

// Seed order is the curated reading order; custom entries go last.
function seedOrder(slug: string): number {
  const i = seedEntries.findIndex((e) => e.slug === slug);
  return i === -1 ? Infinity : i;
}

export async function listRelationsOfKind(kind: RelationKind): Promise<{ a: Entry; b: Entry; note: string | null }[]> {
  if (!isSupabaseConfigured) {
    const { relations, bySlug } = preview();
    return relations
      .filter((r) => r.kind === kind)
      .map((r) => ({ a: bySlug.get(r.from_id)!, b: bySlug.get(r.to_id)!, note: r.note }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entry_relations")
    .select("note, a:entries!entry_relations_from_id_fkey(*), b:entries!entry_relations_to_id_fkey(*)")
    .eq("kind", kind);
  if (error) throw error;
  return (data as unknown as { a: Entry | null; b: Entry | null; note: string | null }[]).filter(
    (r): r is { a: Entry; b: Entry; note: string | null } => Boolean(r.a && r.b),
  );
}
