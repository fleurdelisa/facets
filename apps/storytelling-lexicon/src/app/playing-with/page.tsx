import type { Metadata } from "next";
import { PLAY_INFO, PLAY_TYPES } from "@/lib/types";

export const metadata: Metadata = { title: "Playing with a trope" };

export default function PlayingWithPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex max-w-2xl flex-col gap-2">
        <p className="eyebrow">Reference</p>
        <h1 className="font-serif text-4xl font-medium">Playing with a trope</h1>
        <p className="text-lg text-muted">
          A story rarely just uses a trope — it bends it. This is the vocabulary for how, following{" "}
          <a href="https://tvtropes.org/pmwiki/pmwiki.php/Main/PlayingWith" className="underline">TV Tropes</a>. Every
          sighting you log records one of these.
        </p>
      </header>
      <dl className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2">
        {PLAY_TYPES.map((p) => (
          <div key={p} className="flex flex-col gap-1 bg-card p-5">
            <dt className="font-serif text-lg font-medium">{PLAY_INFO[p].label}</dt>
            <dd className="text-sm leading-relaxed text-muted">{PLAY_INFO[p].definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
