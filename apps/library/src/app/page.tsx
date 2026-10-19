import Link from "next/link";
import { quotes } from "@/lib/quotes";
import { SOURCE_LABELS, SOURCE_TYPES, type SourceType } from "@/lib/types";
import { QuoteCard } from "@/components/QuoteCard";
import { SourceLine } from "@/components/SourceLine";

export const dynamic = "force-dynamic";

type Search = { q?: string; tag?: string; type?: string };

function href(current: Search, change: Search) {
  const params = new URLSearchParams(
    Object.entries({ ...current, ...change }).filter(([, v]) => v) as [string, string][],
  );
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const sourceType = SOURCE_TYPES.includes(search.type as SourceType) ? (search.type as SourceType) : undefined;
  const repo = await quotes();
  const [list, tags, daily] = await Promise.all([
    repo.list({ q: search.q, tag: search.tag, sourceType }),
    repo.allTags(),
    repo.quoteOfTheDay(),
  ]);
  const filtering = Boolean(search.q || search.tag || sourceType);

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm transition ${active ? "bg-accent text-on-accent" : "bg-chip text-muted hover:text-ink"}`;

  return (
    <div className="space-y-8">
      {daily && !filtering && (
        <section className="rounded-2xl border border-line bg-card px-6 py-8 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-accent">Today’s quote</p>
          <Link href={`/quotes/${daily.id}`}>
            <blockquote className="font-serif text-2xl leading-snug italic">“{daily.text}”</blockquote>
          </Link>
          <p className="mt-4 text-sm text-muted">
            <SourceLine quote={daily} />
          </p>
        </section>
      )}

      <form action="/" className="flex gap-2">
        {search.tag && <input type="hidden" name="tag" value={search.tag} />}
        {sourceType && <input type="hidden" name="type" value={sourceType} />}
        <input
          name="q"
          defaultValue={search.q}
          placeholder="Search quotes, notes, authors, titles…"
          className="w-full rounded-lg border border-line bg-card px-3 py-2 focus:border-accent focus:outline-none"
        />
        <button className="rounded-lg border border-line bg-card px-4 text-sm hover:border-accent">Search</button>
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Link href={href(search, { type: undefined })} className={chip(!sourceType)}>
            All
          </Link>
          {SOURCE_TYPES.map((t) => (
            <Link key={t} href={href(search, { type: t })} className={chip(sourceType === t)}>
              {SOURCE_LABELS[t]}
            </Link>
          ))}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag, count }) => (
              <Link
                key={tag}
                href={href(search, { tag: search.tag === tag ? undefined : tag })}
                className={chip(search.tag === tag)}
              >
                #{tag} <span className="opacity-60">{count}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between text-sm text-muted">
          <span>
            {list.length} {list.length === 1 ? "quote" : "quotes"}
          </span>
          {filtering && (
            <Link href="/" className="hover:text-ink">
              Clear filters
            </Link>
          )}
        </div>
        {list.map((q) => (
          <QuoteCard key={q.id} quote={q} />
        ))}
        {list.length === 0 && (
          <div className="rounded-xl border border-dashed border-line p-10 text-center text-muted">
            {filtering ? (
              "Nothing matches those filters."
            ) : (
              <>
                No quotes yet.{" "}
                <Link href="/quotes/new" className="text-accent underline">
                  Save your first one
                </Link>
                .
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
