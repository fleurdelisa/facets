"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { logSighting } from "@/app/actions";
import { LayerBadge } from "@/components/layer-badge";
import { MEDIA, PLAY_INFO, PLAY_TYPES, type Layer, type Medium, type PlayType, type WorkStatus } from "@/lib/types";

type WorkOption = { id: string; title: string; medium: Medium; status: WorkStatus };
type EntryOption = { id: string; slug: string; name: string; layer: Layer; summary: string };

const NEW = "__new__";

// The four-tap flow: which work, which entry, how it's played, save. The work
// sticks between saves so several sightings in one episode are quick.
export function QuickLog({
  works,
  initialWorkId,
  initialEntry,
}: {
  works: WorkOption[];
  initialWorkId?: string;
  initialEntry?: EntryOption;
}) {
  const inProgress = works.filter((w) => w.status === "in_progress");
  const [workId, setWorkId] = useState(initialWorkId ?? inProgress[0]?.id ?? (works.length ? works[0].id : NEW));
  const [newWork, setNewWork] = useState<{ title: string; medium: Medium }>({ title: "", medium: "show" });
  const [entry, setEntry] = useState<EntryOption | undefined>(initialEntry);
  const [play, setPlay] = useState<PlayType>("straight");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [saved, setSaved] = useState<{ entry: string; workId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const chips = (inProgress.length ? inProgress : works).slice(0, 6);
  const canSave = Boolean(entry && (workId !== NEW || newWork.title.trim()));

  function save() {
    if (!entry) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await logSighting({
          workId: workId === NEW ? undefined : workId,
          newWork: workId === NEW ? newWork : undefined,
          entryId: entry.id,
          play,
          location,
          note,
          spoiler,
        });
        setSaved({ entry: entry.name, workId: result.workId });
        // Keep the work and location; clear the rest for the next sighting.
        if (workId === NEW) setWorkId(result.workId);
        setEntry(undefined);
        setPlay("straight");
        setNote("");
        setSpoiler(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save that.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-7">
      {saved && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent" role="status">
          Logged {saved.entry}.{" "}
          <Link href={`/catalog/${saved.workId}`} className="underline">See the work</Link>
        </p>
      )}

      <Step n={1} title="Where">
        <div className="flex flex-wrap gap-2">
          {chips.map((w) => (
            <Chip key={w.id} active={workId === w.id} onClick={() => setWorkId(w.id)}>{w.title}</Chip>
          ))}
          <Chip active={workId === NEW} onClick={() => setWorkId(NEW)}>+ New</Chip>
        </div>
        {works.length > chips.length && (
          <select value={chips.some((c) => c.id === workId) || workId === NEW ? "" : workId} onChange={(e) => e.target.value && setWorkId(e.target.value)} className="field text-sm" aria-label="Other work">
            <option value="">Other…</option>
            {works.filter((w) => !chips.includes(w)).map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
          </select>
        )}
        {workId === NEW && (
          <div className="flex gap-2">
            <input value={newWork.title} onChange={(e) => setNewWork({ ...newWork, title: e.target.value })} placeholder="Title" className="field" aria-label="New work title" autoFocus />
            <select value={newWork.medium} onChange={(e) => setNewWork({ ...newWork, medium: e.target.value as Medium })} className="field w-28" aria-label="Medium">
              {MEDIA.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Episode, chapter or timestamp (optional)" className="field text-sm" aria-label="Location" />
      </Step>

      <Step n={2} title="What">
        {entry ? (
          <div data-layer={entry.layer} className="flex items-start justify-between gap-3 rounded-lg border border-layer bg-card p-3">
            <div className="flex flex-col gap-1">
              <LayerBadge layer={entry.layer} />
              <span className="font-serif text-lg">{entry.name}</span>
              <span className="text-sm text-muted">{entry.summary}</span>
            </div>
            <button onClick={() => setEntry(undefined)} className="text-sm text-faint hover:text-ink">change</button>
          </div>
        ) : (
          <EntrySearch onPick={setEntry} />
        )}
      </Step>

      <Step n={3} title="How it's played">
        <div className="flex flex-wrap gap-2">
          {PLAY_TYPES.map((p) => (
            <Chip key={p} active={play === p} onClick={() => setPlay(p)}>{PLAY_INFO[p].label}</Chip>
          ))}
        </div>
        <p className="text-sm text-muted">{PLAY_INFO[play].definition}</p>
      </Step>

      <Step n={4} title="Notes">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What made you notice it? (optional)" className="field text-sm" aria-label="Note" />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} />
          Hide behind a spoiler
        </label>
      </Step>

      {error && <p className="text-sm text-accent">{error}</p>}
      <button onClick={save} disabled={!canSave || pending} className="btn btn-primary py-3 text-base">
        {pending ? "Saving…" : "Save sighting"}
      </button>
    </div>
  );
}

function EntrySearch({ onPick }: { onPick: (e: EntryOption) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<EntryOption[]>([]);
  const latest = useRef("");

  useEffect(() => {
    const query = q.trim();
    latest.current = query;
    if (!query) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as EntryOption[];
      if (latest.current === query) setResults(data);
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="flex flex-col gap-2">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tropes, devices, archetypes…" className="field" aria-label="Search entries" autoFocus />
      {results.length > 0 && (
        <ul className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-card">
          {results.map((r) => (
            <li key={r.id} data-layer={r.layer}>
              <button onClick={() => onPick(r)} className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left hover:bg-paper">
                <span className="flex items-baseline gap-2">
                  <span className="font-serif">{r.name}</span>
                  <LayerBadge layer={r.layer} />
                </span>
                <span className="line-clamp-1 text-xs text-muted">{r.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[0.7rem] text-paper">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active ? "border-ink bg-ink text-paper" : "border-rule bg-card text-ink hover:border-faint"
      }`}
    >
      {children}
    </button>
  );
}
