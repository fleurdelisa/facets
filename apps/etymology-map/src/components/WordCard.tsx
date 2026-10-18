"use client";

import { useState } from "react";
import { GROUPS } from "@/data/groups";
import type { Etymon, Word } from "@/lib/etymology";

interface WordCardProps {
  word: Word;
  counts: Record<string, number>;
  highlight: string | null;
  onHighlight: (id: string | null) => void;
}

export default function WordCard({ word, counts, highlight, onHighlight }: WordCardProps) {
  const [open, setOpen] = useState(true);
  const etyma: Etymon[] = Object.values(word.etyma)
    .filter((e) => counts[e.id])
    .sort((a, b) => counts[b.id] - counts[a.id]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-baseline justify-between gap-3 px-5 pt-4 pb-3 text-left"
      >
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-[var(--ink)]">
          {word.word}
        </h2>
        <span className="text-xs text-[var(--ink-faint)]">{open ? "Hide" : "Show"} roots</span>
      </button>
      {open && (
        <div className="min-h-0 overflow-y-auto px-5 pb-4">
          <p className="text-[13.5px] leading-relaxed text-[var(--ink-soft)]">{word.story}</p>
          <ul className="mt-4 space-y-0.5" onPointerLeave={() => onHighlight(null)}>
            {etyma.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onPointerEnter={() => onHighlight(e.id)}
                  onFocus={() => onHighlight(e.id)}
                  onBlur={() => onHighlight(null)}
                  onClick={() => onHighlight(highlight === e.id ? null : e.id)}
                  className={`flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left transition ${
                    highlight === e.id ? "bg-[var(--paper)]" : "hover:bg-[var(--paper)]"
                  }`}
                >
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ background: e.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-[var(--ink)]">{e.label}</span>
                    <span className="block text-[11.5px] leading-snug text-[var(--ink-faint)]">
                      {GROUPS[e.group].label}
                      {e.note && <> · {e.note}</>}
                    </span>
                  </span>
                  <span className="mt-0.5 text-[11px] tabular-nums text-[var(--ink-faint)]">
                    {counts[e.id]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
