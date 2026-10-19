import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSighting, deleteWork, updateWork } from "@/app/actions";
import { LayerBadge } from "@/components/layer-badge";
import { PlayBadge } from "@/components/play-badge";
import { Spoiler } from "@/components/spoiler";
import { getWork } from "@/lib/catalog";
import { LAYER_INFO, LAYERS, WORK_STATUS_LABEL, WORK_STATUSES } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getWork((await params).id);
  return { title: found?.work.title ?? "Not found" };
}

export default async function WorkPage({ params }: Props) {
  const { id } = await params;
  const found = await getWork(id);
  if (!found) notFound();
  const { work, sightings } = found;

  const byLayer = LAYERS.map((layer) => ({ layer, items: sightings.filter((s) => s.entry.layer === layer) })).filter(
    (g) => g.items.length,
  );

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <Link href="/catalog" className="text-sm text-muted hover:text-ink">← Catalog</Link>
        <p className="eyebrow">{work.medium}{work.year ? ` · ${work.year}` : ""}</p>
        <h1 className="font-serif text-4xl font-medium">{work.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href={`/log?work=${work.id}`} className="btn btn-primary">+ Log a sighting</Link>
        </div>
      </header>

      {sightings.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow">Fingerprint</h2>
          <div className="flex h-3 overflow-hidden rounded-full">
            {byLayer.map((g) => (
              <span key={g.layer} data-layer={g.layer} className="bg-layer" style={{ flex: g.items.length }} title={`${LAYER_INFO[g.layer].plural}: ${g.items.length}`} />
            ))}
          </div>
          <p className="flex flex-wrap gap-x-4 text-xs text-muted">
            {byLayer.map((g) => (
              <span key={g.layer} data-layer={g.layer}><span className="text-layer">●</span> {LAYER_INFO[g.layer].plural} {g.items.length}</span>
            ))}
          </p>
        </section>
      )}

      {sightings.length === 0 ? (
        <p className="text-muted">Nothing logged for this one yet.</p>
      ) : (
        byLayer.map(({ layer, items }) => (
          <section key={layer} className="flex flex-col gap-3">
            <LayerBadge layer={layer} />
            <ul className="divide-y divide-rule rounded-xl border border-rule bg-card">
              {items.map((s) => (
                <li key={s.id} className="flex flex-col gap-1.5 p-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Link href={`/entry/${s.entry.slug}`} className="font-serif text-lg hover:text-accent">{s.entry.name}</Link>
                    <PlayBadge play={s.play} />
                    {s.location && <span className="text-xs text-faint">{s.location}</span>}
                    <form action={deleteSighting.bind(null, s.id, work.id)} className="ml-auto">
                      <button className="text-xs text-faint hover:text-accent">remove</button>
                    </form>
                  </div>
                  {s.note && (
                    <Spoiler spoiler={s.spoiler}>
                      <p className="text-sm text-muted">{s.note}</p>
                    </Spoiler>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <form action={updateWork.bind(null, work.id)} className="flex flex-col gap-3 border-t border-rule pt-6">
        <h2 className="eyebrow">About this work</h2>
        <select name="status" defaultValue={work.status} className="field sm:w-48" aria-label="Status">
          {WORK_STATUSES.map((s) => <option key={s} value={s}>{WORK_STATUS_LABEL[s]}</option>)}
        </select>
        <textarea name="notes" defaultValue={work.notes ?? ""} rows={3} placeholder="Overall notes" className="field" aria-label="Notes" />
        <button className="btn btn-ghost self-start">Save</button>
      </form>

      <details className="text-sm text-faint">
        <summary className="cursor-pointer">Delete this work</summary>
        <form action={deleteWork.bind(null, work.id)} className="mt-2">
          <button className="btn btn-ghost text-accent">Delete “{work.title}” and its {sightings.length} sightings</button>
        </form>
      </details>
    </div>
  );
}
