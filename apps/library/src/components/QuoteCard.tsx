import Link from "next/link";
import type { Quote } from "@/lib/types";
import { SourceLine } from "./SourceLine";
import { LocalTime } from "./LocalTime";

export function QuoteCard({ quote, reasons }: { quote: Quote; reasons?: string[] }) {
  return (
    <Link
      href={`/quotes/${quote.id}`}
      className="group block rounded-xl border border-line bg-card p-5 transition hover:border-accent/60 hover:shadow-sm"
    >
      <blockquote className="font-serif text-lg leading-snug text-ink line-clamp-5">
        “{quote.text}”
      </blockquote>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-muted">
        <SourceLine quote={quote} />
        <span className="text-xs">
          Added <LocalTime iso={quote.createdAt} />
        </span>
      </div>
      {reasons && reasons.length > 0 && (
        <p className="mt-2 text-xs text-accent">{reasons.join(" · ")}</p>
      )}
      {!reasons && quote.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quote.tags.map((t) => (
            <span key={t} className="rounded-full bg-chip px-2 py-0.5 text-xs text-muted">
              #{t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
