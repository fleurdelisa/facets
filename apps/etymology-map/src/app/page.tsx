"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SearchBar from "@/components/SearchBar";
import WordCard from "@/components/WordCard";
import WordWheel from "@/components/WordWheel";
import WorldMap from "@/components/WorldMap";
import { COUNTRIES } from "@/data/countries";
import { readCountry, WORD_INDEX, WORDS } from "@/lib/etymology";
import { search } from "@/lib/search";

const DEFAULT_WORD = "tea";
const LANGUAGE_COUNT = new Set(WORDS.flatMap((w) => Object.keys(w.forms))).size;

export default function Home() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(DEFAULT_WORD);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [romanized, setRomanized] = useState(false);

  const result = useMemo(() => search(query), [query]);
  const word = WORD_INDEX[selected];

  const select = useCallback((w: string) => {
    setSelected(w);
    setHighlight(null);
  }, []);

  // Typing jumps the wheel to the closest match.
  useEffect(() => {
    if (result.best) select(result.best);
  }, [result.best, select]);

  // Deep links: /#coffee
  useEffect(() => {
    const fromHash = () => {
      const w = decodeURIComponent(window.location.hash.slice(1));
      if (WORD_INDEX[w]) select(w);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [select]);
  useEffect(() => {
    window.history.replaceState(null, "", `#${selected}`);
  }, [selected]);

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const name of Object.keys(COUNTRIES)) {
      const id = readCountry(word, name)?.etymon?.id;
      if (id) out[id] = (out[id] ?? 0) + 1;
    }
    return out;
  }, [word]);

  return (
    <main className="grid min-h-dvh grid-cols-1 bg-[var(--paper)] text-[var(--ink)] md:h-dvh md:grid-cols-[360px_minmax(0,1fr)] md:grid-rows-[auto_auto_minmax(0,1fr)]">
      <div className="flex flex-col gap-4 px-5 pt-5 md:border-r md:border-[var(--line)]">
        <header>
          <p className="text-[11px] tracking-[0.18em] text-[var(--ink-faint)] uppercase">Facets</p>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Etymology Map</h1>
          <p className="mt-1 text-[13px] leading-snug text-[var(--ink-soft)]">
            One word, every country: see where the world&apos;s words for it come from.
          </p>
        </header>
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={() => result.best && select(result.best)}
          hint={result.hint}
        />
      </div>

      <div className="h-[220px] px-5 md:h-[300px] md:border-r md:border-[var(--line)]">
        <WordWheel items={result.items} selected={selected} onSelect={select} />
      </div>

      <section className="relative h-[72vw] min-h-[280px] border-y border-[var(--line)] md:col-start-2 md:row-span-3 md:row-start-1 md:h-auto md:border-0">
        <WorldMap word={word} romanized={romanized} highlight={highlight} />
        <div className="absolute top-4 left-4 flex rounded-lg border border-[var(--line)] bg-[var(--paper-raised)]/90 p-0.5 text-xs shadow-sm backdrop-blur">
          {[
            { label: "Native script", value: false },
            { label: "Romanized", value: true },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setRomanized(opt.value)}
              aria-pressed={romanized === opt.value}
              className={`rounded-md px-2.5 py-1.5 transition ${
                romanized === opt.value
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <div className="flex min-h-0 flex-col gap-3 px-5 pt-4 pb-5 md:border-r md:border-[var(--line)]">
        <WordCard word={word} counts={counts} highlight={highlight} onHighlight={setHighlight} />
        <p className="text-[11px] text-[var(--ink-faint)]">
          {WORDS.length} words · {LANGUAGE_COUNT} languages · scroll, drag or use ↑ ↓ on the wheel
        </p>
      </div>
    </main>
  );
}
