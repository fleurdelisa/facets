import Link from "next/link";
import { notFound } from "next/navigation";
import { quotes } from "@/lib/quotes";
import { DeleteButton } from "@/components/DeleteButton";
import { LocalTime } from "@/components/LocalTime";
import { QuoteCard } from "@/components/QuoteCard";
import { SourceLine } from "@/components/SourceLine";

export const dynamic = "force-dynamic";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = await quotes();
  const quote = await repo.get(id);
  if (!quote) notFound();
  const related = (await repo.related(id)) ?? [];
  const edited = quote.updatedAt !== quote.createdAt;

  return (
    <article className="space-y-10">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-ink">
          ← All quotes
        </Link>
        <blockquote className="mt-6 border-l-4 border-accent pl-6 font-serif text-3xl leading-snug">
          “{quote.text}”
        </blockquote>
        <p className="mt-4 pl-7 text-muted">
          — <SourceLine quote={quote} />
        </p>
        {quote.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 pl-7">
            {quote.tags.map((t) => (
              <Link key={t} href={`/?tag=${encodeURIComponent(t)}`} className="rounded-full bg-chip px-2.5 py-0.5 text-sm text-muted hover:text-ink">
                #{t}
              </Link>
            ))}
          </div>
        )}
      </div>

      <section className="rounded-xl border border-line bg-card p-6">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-accent">Why I love it</h2>
        {quote.notes ? (
          <p className="whitespace-pre-wrap leading-relaxed">{quote.notes}</p>
        ) : (
          <p className="text-muted">
            No notes yet.{" "}
            <Link href={`/quotes/${quote.id}/edit`} className="text-accent underline">
              Add why it matters to you
            </Link>
            .
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line py-3 text-sm text-muted">
        <span>
          Added <LocalTime iso={quote.createdAt} withTime />
          {edited && (
            <>
              {" · "}Edited <LocalTime iso={quote.updatedAt} withTime />
            </>
          )}
        </span>
        <div className="flex gap-2">
          <Link href={`/quotes/${quote.id}/edit`} className="rounded-lg border border-line px-3 py-1.5 text-ink hover:border-accent">
            Edit
          </Link>
          <DeleteButton id={quote.id} />
        </div>
      </div>

      <section>
        <h2 className="mb-4 font-serif text-2xl">Related quotes</h2>
        {related.length > 0 ? (
          <div className="space-y-3">
            {related.map((r) => (
              <QuoteCard key={r.quote.id} quote={r.quote} reasons={r.reasons} />
            ))}
          </div>
        ) : (
          <p className="text-muted">
            Nothing related yet. Suggestions come from shared tags, the same author or source, and similar
            wording in the quote and your notes.
          </p>
        )}
      </section>
    </article>
  );
}
