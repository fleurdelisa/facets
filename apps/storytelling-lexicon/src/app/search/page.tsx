import type { Metadata } from "next";
import { EntryCard } from "@/components/entry-card";
import { searchEntries } from "@/lib/glossary";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const results = q ? await searchEntries(q, 40) : [];

  return (
    <div className="flex flex-col gap-8">
      <form className="flex max-w-xl gap-2">
        <input name="q" type="search" defaultValue={q} autoFocus placeholder="Search the lexicon…" className="field text-base" aria-label="Search" />
        <button className="btn btn-primary">Search</button>
      </form>
      {q && (
        <p className="text-sm text-muted">
          {results.length ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Nothing found"} for “{q}”
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((e) => (
          <EntryCard key={e.id} entry={e} />
        ))}
      </div>
    </div>
  );
}
