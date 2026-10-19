"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveQuote, type FormState } from "@/app/actions";
import { SOURCE_LABELS, SOURCE_TYPES, type Quote } from "@/lib/types";

const LOCATION_HINT: Record<string, string> = {
  book: "p. 42 or ch. 3",
  podcast: "Episode 12 @ 1:23:45",
  movie: "1:02:10",
  tv: "S2E4 @ 18:30",
  song: "Verse 2",
};

const field =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function QuoteForm({ quote }: { quote?: Quote }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveQuote.bind(null, quote?.id ?? null),
    {},
  );
  const err = (name: string) =>
    state.errors?.[name]?.[0] && <p className="mt-1 text-sm text-danger">{state.errors[name]![0]}</p>;

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Quote</span>
        <textarea
          name="text"
          required
          rows={5}
          defaultValue={quote?.text}
          placeholder="The words that stopped you in your tracks…"
          className={`${field} font-serif text-lg`}
        />
        {err("text")}
      </label>

      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Type</span>
          <select name="sourceType" defaultValue={quote?.sourceType ?? "book"} className={field}>
            {SOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {SOURCE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Title</span>
          <input name="sourceTitle" defaultValue={quote?.sourceTitle} placeholder="Book, show, episode, film…" className={field} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Who said it</span>
          <input name="author" defaultValue={quote?.author} placeholder="Author, speaker, character" className={field} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Where in it</span>
          <input
            name="location"
            defaultValue={quote?.location}
            placeholder={LOCATION_HINT[quote?.sourceType ?? "book"] ?? "Page, timestamp…"}
            className={field}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Why I love it</span>
        <textarea
          name="notes"
          rows={5}
          defaultValue={quote?.notes}
          placeholder="What it means to you, when you heard it, what it changed…"
          className={field}
        />
        {err("notes")}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Tags</span>
        <input
          name="tags"
          defaultValue={quote?.tags.join(", ")}
          placeholder="courage, grief, craft"
          className={field}
        />
        <span className="mt-1 block text-xs text-muted">Comma-separated. Shared tags help surface related quotes.</span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-5 py-2 font-medium text-on-accent transition hover:bg-accent/90 disabled:opacity-60"
        >
          {pending ? "Saving…" : quote ? "Save changes" : "Save quote"}
        </button>
        <Link href={quote ? `/quotes/${quote.id}` : "/"} className="text-sm text-muted hover:text-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}
