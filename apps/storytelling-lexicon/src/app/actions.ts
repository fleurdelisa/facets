"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LAYERS,
  MEDIA,
  PLAY_TYPES,
  WORK_STATUSES,
  type Layer,
  type Medium,
  type PlayType,
  type WorkStatus,
} from "@/lib/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const oneOf = <T extends string>(list: readonly T[], v: string, fallback: T): T =>
  (list as readonly string[]).includes(v) ? (v as T) : fallback;

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return { supabase, user: data.user };
}

// Auth ------------------------------------------------------------------------

export async function signIn(formData: FormData) {
  const email = text(formData.get("email"));
  const next = text(formData.get("next")) || "/catalog";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      // Only an existing account can sign in; the catalog is private.
      shouldCreateUser: false,
    },
  });
  redirect(error ? `/login?error=${encodeURIComponent(error.message)}` : "/login?sent=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// Works -----------------------------------------------------------------------

export async function createWork(formData: FormData) {
  const { supabase } = await requireUser();
  const year = Number(text(formData.get("year")));
  const { data, error } = await supabase
    .from("works")
    .insert({
      title: text(formData.get("title")),
      medium: oneOf<Medium>(MEDIA, text(formData.get("medium")), "show"),
      status: oneOf<WorkStatus>(WORK_STATUSES, text(formData.get("status")), "in_progress"),
      year: Number.isInteger(year) && year > 0 ? year : null,
    })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePath("/catalog");
  redirect(`/catalog/${data.id}`);
}

export async function updateWork(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("works")
    .update({
      status: oneOf<WorkStatus>(WORK_STATUSES, text(formData.get("status")), "in_progress"),
      notes: text(formData.get("notes")) || null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(`/catalog/${id}`);
  revalidatePath("/catalog");
}

export async function deleteWork(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("works").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/catalog");
  redirect("/catalog");
}

// Sightings -------------------------------------------------------------------

export type LogSightingInput = {
  workId?: string;
  newWork?: { title: string; medium: Medium };
  entryId: string;
  play: PlayType;
  location?: string;
  note?: string;
  spoiler?: boolean;
};

export async function logSighting(input: LogSightingInput): Promise<{ workId: string }> {
  const { supabase } = await requireUser();

  let workId = input.workId;
  if (!workId && input.newWork?.title.trim()) {
    const { data, error } = await supabase
      .from("works")
      .insert({ title: input.newWork.title.trim(), medium: oneOf<Medium>(MEDIA, input.newWork.medium, "show") })
      .select("id")
      .single();
    if (error) throw error;
    workId = data.id as string;
  }
  if (!workId) throw new Error("Pick a work first.");

  const { error } = await supabase.from("sightings").insert({
    work_id: workId,
    entry_id: input.entryId,
    play: oneOf<PlayType>(PLAY_TYPES, input.play, "straight"),
    location: input.location?.trim() || null,
    note: input.note?.trim() || null,
    spoiler: Boolean(input.spoiler),
  });
  if (error) throw error;
  revalidatePath(`/catalog/${workId}`);
  revalidatePath("/catalog");
  revalidatePath("/entry/[slug]", "page");
  return { workId };
}

export async function deleteSighting(id: string, workId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("sightings").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(`/catalog/${workId}`);
  revalidatePath("/entry/[slug]", "page");
}

// Notes and custom entries ----------------------------------------------------

export async function saveNote(entryId: string, slug: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const body = text(formData.get("body"));
  const { error } = body
    ? await supabase
        .from("entry_notes")
        .upsert({ owner_id: user.id, entry_id: entryId, body, updated_at: new Date().toISOString() })
    : await supabase.from("entry_notes").delete().eq("entry_id", entryId);
  if (error) throw error;
  revalidatePath(`/entry/${slug}`);
}

const slugify = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "entry";

export async function createEntry(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = text(formData.get("name"));
  if (!name) throw new Error("Name is required.");

  // Find a slug no visible entry (glossary or yours) already uses.
  const base = slugify(name);
  const { data: taken } = await supabase.from("entries").select("slug").like("slug", `${base}%`);
  const used = new Set((taken ?? []).map((r) => r.slug as string));
  let slug = base;
  for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;

  const { error } = await supabase.from("entries").insert({
    slug,
    name,
    layer: oneOf<Layer>(LAYERS, text(formData.get("layer")), "trope"),
    summary: text(formData.get("summary")) || name,
    description: text(formData.get("description")) || null,
    aliases: text(formData.get("aliases"))
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean),
    owner_id: user.id,
  });
  if (error) throw error;
  redirect(`/entry/${slug}`);
}

export async function deleteEntry(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
  redirect("/");
}
