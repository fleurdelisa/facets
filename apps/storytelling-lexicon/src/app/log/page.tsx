import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listWorks } from "@/lib/catalog";
import { getEntry } from "@/lib/glossary";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { QuickLog } from "./quick-log";

export const metadata: Metadata = { title: "Log a sighting" };

type Props = { searchParams: Promise<{ entry?: string; work?: string }> };

export default async function LogPage({ searchParams }: Props) {
  if (!isSupabaseConfigured) redirect("/login");
  const { entry: entrySlug, work } = await searchParams;
  const [works, found] = await Promise.all([listWorks(), entrySlug ? getEntry(entrySlug) : null]);
  const entry = found?.entry;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="font-serif text-3xl font-medium">Log a sighting</h1>
      <QuickLog
        works={works.filter((w) => w.status !== "dropped").map(({ id, title, medium, status }) => ({ id, title, medium, status }))}
        initialWorkId={work}
        initialEntry={entry ? { id: entry.id, slug: entry.slug, name: entry.name, layer: entry.layer, summary: entry.summary } : undefined}
      />
    </div>
  );
}
