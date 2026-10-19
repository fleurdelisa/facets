import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteEntry, deleteSighting, saveNote } from "@/app/actions";
import { ArcChart } from "@/components/arc-chart";
import { LayerBadge } from "@/components/layer-badge";
import { PlayBadge } from "@/components/play-badge";
import { Spoiler } from "@/components/spoiler";
import { getNote, sightingsForEntry } from "@/lib/catalog";
import { getEntry, type Related } from "@/lib/glossary";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";
import type { Entry } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await getEntry(slug);
  return found ? { title: found.entry.name, description: found.entry.summary } : { title: "Not found" };
}

// How each relation reads from this entry's side.
function groupRelations(related: Related[]) {
  const groups: { title: string; items: Related[] }[] = [
    { title: "Often confused with", items: related.filter((r) => r.kind === "confused_with") },
    { title: "Broader", items: related.filter((r) => r.kind === "subtrope_of" && r.direction === "out") },
    { title: "Narrower", items: related.filter((r) => r.kind === "subtrope_of" && r.direction === "in") },
    { title: "Opposite", items: related.filter((r) => r.kind === "opposite_of") },
    { title: "Related", items: related.filter((r) => r.kind === "related_to") },
  ];
  return groups.filter((g) => g.items.length);
}

export default async function EntryPage({ params }: Props) {
  const { slug } = await params;
  const found = await getEntry(slug);
  if (!found) notFound();
  const { entry, related } = found;

  const user = isSupabaseConfigured ? await getUser() : null;
  const [note, sightings] = user ? await Promise.all([getNote(entry.id), sightingsForEntry(entry.id)]) : ["", []];

  const stages = related
    .filter((r) => r.kind === "stage_of" && r.direction === "in")
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const parent = related.find((r) => r.kind === "stage_of" && r.direction === "out");

  return (
    <article data-layer={entry.layer} className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <LayerBadge layer={entry.layer} link />
            {entry.family && <span className="text-xs text-faint">{entry.family}</span>}
            {entry.owner_id && <span className="eyebrow">your entry</span>}
          </div>
          <h1 className="font-serif text-4xl leading-tight font-medium tracking-tight sm:text-5xl">{entry.name}</h1>
          {entry.aliases.length > 0 && (
            <p className="text-sm text-muted">
              also <span className="italic">{entry.aliases.join(", ")}</span>
            </p>
          )}
          <p className="font-serif text-xl leading-relaxed text-ink/90">{entry.summary}</p>
        </header>

        {entry.arc_points && (
          <ArcChart points={entry.arc_points} labelled className="h-40 w-full rounded-xl border border-rule bg-card" />
        )}

        {parent && <BeatNav parent={parent.entry} position={parent.position} />}

        {stages.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="eyebrow">Stages</h2>
            <ol className="flex flex-col divide-y divide-rule rounded-xl border border-rule bg-card">
              {stages.map((s) => (
                <li key={s.entry.id}>
                  <Link href={`/entry/${s.entry.slug}`} className="group flex items-start gap-4 px-4 py-3">
                    <span className="w-5 shrink-0 pt-0.5 text-sm text-faint tabular-nums">{s.position}</span>
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="font-serif font-medium group-hover:text-layer">{s.entry.name}</span>
                      <span className="text-sm text-muted">{s.entry.summary}</span>
                    </span>
                    <Span start={s.story_start ?? 0} end={s.story_end ?? 0} />
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        {entry.description && (
          <section className="flex flex-col gap-4">
            <div className="flex max-w-prose flex-col gap-4 leading-relaxed">
              {entry.description.split(/\n{2,}/).map((p, i) => (
                <p key={i} className="whitespace-pre-line">{p}</p>
              ))}
            </div>
            {entry.description_source && (
              <p className="text-xs text-faint">
                Description from{" "}
                {entry.description_url ? (
                  <a href={entry.description_url} className="underline hover:text-ink">{entry.description_source}</a>
                ) : (
                  entry.description_source
                )}
                {entry.description_license && <>, {entry.description_license}</>}.
              </p>
            )}
          </section>
        )}

        {(entry.source_name || entry.tvtropes) && (
          <section className="flex flex-col gap-1 border-t border-rule pt-4 text-sm text-muted">
            {entry.source_name && (
              <p>
                <span className="eyebrow mr-2">Source</span>
                {entry.source_url ? <a href={entry.source_url} className="underline">{entry.source_name}</a> : entry.source_name}
              </p>
            )}
            {entry.tvtropes && !entry.description_url && (
              <p>
                <span className="eyebrow mr-2">Read more</span>
                <a href={`https://tvtropes.org/pmwiki/pmwiki.php/${entry.tvtropes}`} className="underline">TV Tropes</a>
              </p>
            )}
          </section>
        )}

        {groupRelations(related).map((g) => (
          <section key={g.title} className="flex flex-col gap-3">
            <h2 className="eyebrow">{g.title}</h2>
            <ul className="flex flex-col gap-2">
              {g.items.map((r) => (
                <li key={r.entry.id + r.kind} data-layer={r.entry.layer} className="flex flex-col gap-0.5">
                  <Link href={`/entry/${r.entry.slug}`} className="group flex flex-wrap items-baseline gap-x-3">
                    <span className="font-serif text-lg group-hover:text-layer">{r.entry.name}</span>
                    <LayerBadge layer={r.entry.layer} />
                  </Link>
                  <span className="text-sm text-muted">{r.note ?? r.entry.summary}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {user && (
        <aside className="flex flex-col gap-8 lg:sticky lg:top-6 lg:self-start">
          <Link href={`/log?entry=${entry.slug}`} className="btn btn-primary">Log a sighting</Link>

          <section className="flex flex-col gap-3">
            <h2 className="eyebrow">Where you&apos;ve seen it</h2>
            {sightings.length === 0 ? (
              <p className="text-sm text-faint">Nothing logged yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {sightings.map((s) => (
                  <li key={s.id} className="flex flex-col gap-1 rounded-lg border border-rule bg-card p-3 text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link href={`/catalog/${s.work.id}`} className="font-medium hover:text-accent">{s.work.title}</Link>
                      {s.location && <span className="text-xs text-faint">{s.location}</span>}
                    </div>
                    <div><PlayBadge play={s.play} /></div>
                    {s.note && (
                      <Spoiler spoiler={s.spoiler}>
                        <p className="text-muted">{s.note}</p>
                      </Spoiler>
                    )}
                    <form action={deleteSighting.bind(null, s.id, s.work.id)} className="self-end">
                      <button className="text-xs text-faint hover:text-accent">remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form action={saveNote.bind(null, entry.id, entry.slug)} className="flex flex-col gap-2">
            <label htmlFor="note" className="eyebrow">Your notes</label>
            <textarea id="note" name="body" defaultValue={note} rows={5} className="field text-sm" placeholder="Thoughts, examples, how you'd use it…" />
            <button className="btn btn-ghost self-end">Save note</button>
          </form>

          {entry.owner_id && (
            <form action={deleteEntry.bind(null, entry.id)}>
              <button className="text-xs text-faint hover:text-accent">Delete this entry</button>
            </form>
          )}
        </aside>
      )}
    </article>
  );
}

// A little bar showing where in the story a beat falls.
function Span({ start, end }: { start: number; end: number }) {
  return (
    <span className="relative mt-2 hidden h-1.5 w-24 shrink-0 rounded-full bg-rule sm:block" aria-label={`${Math.round(start * 100)}–${Math.round(end * 100)}% of the story`}>
      <span className="bg-layer absolute inset-y-0 rounded-full" style={{ left: `${start * 100}%`, width: `${Math.max((end - start) * 100, 4)}%` }} />
    </span>
  );
}

function BeatNav({ parent, position }: { parent: Entry; position: number | null }) {
  return (
    <p className="text-sm text-muted">
      Stage {position} of{" "}
      <Link href={`/entry/${parent.slug}`} className="font-medium text-layer underline-offset-2 hover:underline">
        {parent.name}
      </Link>
      {" · "}
      <Link href="/structures" className="underline-offset-2 hover:underline">compare structures</Link>
    </p>
  );
}
