import { SOURCE_LABELS, type Quote } from "@/lib/types";

export function SourceLine({ quote }: { quote: Quote }) {
  return (
    <span>
      <span className="mr-2 rounded bg-chip px-1.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide">
        {SOURCE_LABELS[quote.sourceType]}
      </span>
      {quote.author && <span className="text-ink">{quote.author}</span>}
      {quote.author && quote.sourceTitle && ", "}
      {quote.sourceTitle && <cite>{quote.sourceTitle}</cite>}
      {quote.location && <span> · {quote.location}</span>}
    </span>
  );
}
