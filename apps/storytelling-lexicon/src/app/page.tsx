import Link from "next/link";
import { countByLayer, listEntries, listRelationsOfKind } from "@/lib/glossary";
import { LAYER_INFO, LAYERS, type Layer } from "@/lib/types";

// Beats are browsed through their structures.
const SHELVES = LAYERS.filter((l) => l !== "beat");

const SAMPLES: Record<Exclude<Layer, "beat">, string[]> = {
  plot: ["voyage-and-return", "overcoming-the-monster", "rebirth"],
  arc: ["man-in-a-hole", "cinderella", "icarus"],
  structure: ["heros-journey", "save-the-cat", "kishotenketsu"],
  archetype: ["the-mentor", "the-trickster", "the-shadow"],
  trope: ["the-underdog", "the-dark-horse", "there-and-back-again"],
  device: ["chekhovs-gun", "red-herring", "in-medias-res"],
  motif: ["forbidden-fruit", "the-labyrinth", "the-mask"],
};

export default async function Home() {
  const [counts, entries, confusions] = await Promise.all([
    countByLayer(),
    listEntries(),
    listRelationsOfKind("confused_with"),
  ]);
  const bySlug = new Map(entries.map((e) => [e.slug, e]));

  return (
    <div className="flex flex-col gap-16">
      <section className="flex max-w-2xl flex-col gap-5 pt-4">
        <p className="eyebrow">{entries.length} entries across seven layers</p>
        <h1 className="font-serif text-4xl leading-[1.1] font-medium tracking-tight sm:text-5xl">
          A field guide to the machinery of stories.
        </h1>
        <p className="text-lg leading-relaxed text-muted">
          From the shape of a whole plot down to a single recurring image — look things up, see how they connect, and
          keep a record of where you spot them.
        </p>
        <form action="/search" className="flex gap-2">
          <input name="q" type="search" placeholder="Try “underdog”, “chekov”, “journey home”…" className="field text-base" aria-label="Search" />
          <button className="btn btn-primary">Search</button>
        </form>
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
        {SHELVES.map((layer) => (
          <Link key={layer} href={`/browse/${layer}`} data-layer={layer} className="group flex flex-col gap-3 bg-card p-5 hover:bg-paper">
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-xl font-medium group-hover:text-layer">{LAYER_INFO[layer].plural}</h2>
              <span className="text-sm text-faint tabular-nums">
                {(counts[layer] ?? 0) + (layer === "structure" ? (counts.beat ?? 0) : 0)}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted">{LAYER_INFO[layer].blurb}</p>
            <p className="mt-auto text-sm text-layer">
              {SAMPLES[layer]
                .map((s) => bySlug.get(s)?.name)
                .filter(Boolean)
                .join(" · ")}
            </p>
          </Link>
        ))}
        <Link href="/playing-with" className="group flex flex-col gap-3 bg-card p-5 hover:bg-paper">
          <h2 className="font-serif text-xl font-medium group-hover:text-accent">Playing with</h2>
          <p className="text-sm leading-relaxed text-muted">
            The vocabulary for how a story uses a trope: straight, subverted, inverted, lampshaded…
          </p>
        </Link>
        <Link href="/structures" className="group flex flex-col gap-3 bg-card p-5 hover:bg-paper sm:col-span-2 lg:col-span-1">
          <h2 className="font-serif text-xl font-medium group-hover:text-accent">Structures, side by side</h2>
          <p className="text-sm leading-relaxed text-muted">
            The hero&apos;s journey, Save the Cat, Freytag and more on one timeline.
          </p>
        </Link>
      </section>

      {confusions.length > 0 && (
        <section className="flex flex-col gap-6">
          <div>
            <p className="eyebrow">Often confused</p>
            <h2 className="font-serif text-2xl font-medium">Close, but not the same</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {confusions.slice(0, 6).map(({ a, b, note }) => (
              <div key={a.id + b.id} className="flex flex-col gap-2 rounded-xl border border-rule p-4">
                <p className="font-serif text-lg">
                  <Link href={`/entry/${a.slug}`} className="hover:text-accent">{a.name}</Link>
                  <span className="mx-2 text-faint italic">vs</span>
                  <Link href={`/entry/${b.slug}`} className="hover:text-accent">{b.name}</Link>
                </p>
                {note && <p className="text-sm leading-relaxed text-muted">{note}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
