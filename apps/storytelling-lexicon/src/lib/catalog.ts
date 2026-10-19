import "server-only";
import { createClient } from "./supabase/server";
import type { Entry, Sighting, Work } from "./types";

// Everything here runs as the signed-in user; RLS keeps it private.

export type WorkWithCount = Work & { sighting_count: number };
export type SightingWithEntry = Sighting & { entry: Entry };
export type SightingWithWork = Sighting & { work: Work };

export async function listWorks(): Promise<WorkWithCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("works")
    .select("*, sightings(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as (Work & { sightings: { count: number }[] })[]).map(({ sightings, ...w }) => ({
    ...w,
    sighting_count: sightings[0]?.count ?? 0,
  }));
}

export async function getWork(id: string): Promise<{ work: Work; sightings: SightingWithEntry[] } | null> {
  const supabase = await createClient();
  const [work, sightings] = await Promise.all([
    supabase.from("works").select("*").eq("id", id).maybeSingle(),
    supabase.from("sightings").select("*, entry:entries(*)").eq("work_id", id).order("created_at"),
  ]);
  if (work.error) throw work.error;
  if (sightings.error) throw sightings.error;
  if (!work.data) return null;
  return { work: work.data as Work, sightings: sightings.data as SightingWithEntry[] };
}

export async function sightingsForEntry(entryId: string): Promise<SightingWithWork[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sightings")
    .select("*, work:works(*)")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as SightingWithWork[];
}

export async function getNote(entryId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("entry_notes").select("body").eq("entry_id", entryId).maybeSingle();
  if (error) throw error;
  return data?.body ?? "";
}
