import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntryCard, EntryList } from "@/components/entry-card";
import { listEntries, listStructures } from "@/lib/glossary";
import { LAYER_INFO, LAYERS, type Entry, type Layer } from "@/lib/types";

type Props = { params: Promise<{ layer: string }> };

const isLayer = (l: string): l is Layer => (LAYERS as readonly string[]).includes(l);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { layer } = await params;
  return { title: isLayer(layer) ? LAYER_INFO[layer].plural : "Not found" };
}

function groupBy<T>(items: T[], key: (t: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(key(item), [...(groups.get(key(item)) ?? []), item]);
  return [...groups];
}

const initial = (e: Entry) => {
  const c = e.name.replace(/^(the|a|an) /i, "").charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : "#";
};

export default async function BrowsePage({ params }: Props) {
  const { layer } = await params;
  if (!isLayer(layer)) notFound();
  const info = LAYER_INFO[layer];

  return (
    <div className="flex flex-col gap-10">
      <nav className="flex flex-wrap gap-2 text-sm">
        {LAYERS.filter((l) => l !== "beat").map((l) => (
          <Link
            key={l}
            href={`/browse/${l}`}
            data-layer={l}
            className={`rounded-full border px-3 py-1 ${l === layer ? "border-layer bg-layer-soft text-layer" : "border-rule text-muted hover:text-ink"}`}
          >
            {LAYER_INFO[l].plural}
          </Link>
        ))}
      </nav>

      <header data-layer={layer} className="flex max-w-2xl flex-col gap-2">
        <h1 className="font-serif text-4xl font-medium text-layer">{info.plural}</h1>
        <p className="text-lg text-muted">{info.blurb}</p>
      </header>

      <Body layer={layer} />
    </div>
  );
}

async function Body({ layer }: { layer: Layer }) {
  if (layer === "structure" || layer === "beat") {
    const structures = await listStructures();
    return (
      <div className="flex flex-col gap-8">
        <Link href="/structures" className="btn btn-ghost self-start">Compare them side by side →</Link>
        {structures.map(({ structure, beats }) => (
          <section key={structure.id} data-layer="structure" className="flex flex-col gap-3 border-t border-rule pt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link href={`/entry/${structure.slug}`} className="font-serif text-2xl font-medium hover:text-layer">
                {structure.name}
              </Link>
              <span className="text-sm text-faint">{structure.family}</span>
            </div>
            <p className="text-muted">{structure.summary}</p>
            <ol className="flex flex-wrap gap-2">
              {beats.map((b) => (
                <li key={b.id}>
                  <Link href={`/entry/${b.slug}`} className="inline-flex gap-1.5 rounded-full border border-rule px-3 py-1 text-sm hover:border-layer">
                    <span className="text-faint tabular-nums">{b.position}</span>
                    {b.name}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    );
  }

  const entries = await listEntries(layer);

  if (layer === "arc") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((e) => (
          <EntryCard key={e.id} entry={e} showLayer={false} />
        ))}
      </div>
    );
  }

  // Families (Booker, Polti, Vogler) read best as groups; the big layers as an A–Z.
  if (layer === "plot" || layer === "archetype") {
    const groups = groupBy(entries, (e) => e.family ?? (e.owner_id ? "Yours" : "More"));
    return (
      <div className="flex flex-col gap-10">
        {groups.map(([family, items]) => (
          <section key={family} className="flex flex-col gap-2">
            <h2 className="eyebrow">{FAMILY_TITLES[family] ?? family}</h2>
            <EntryList entries={family === "Polti" ? sortPolti(items) : items} />
          </section>
        ))}
      </div>
    );
  }

  const letters = groupBy(entries, initial).sort(([a], [b]) => a.localeCompare(b));
  return (
    <div className="flex flex-col gap-8">
      <nav className="flex flex-wrap gap-1 text-sm">
        {letters.map(([l]) => (
          <a key={l} href={`#${l}`} className="rounded px-1.5 text-muted hover:bg-card hover:text-ink">{l}</a>
        ))}
      </nav>
      {letters.map(([l, items]) => (
        <section key={l} id={l} className="flex scroll-mt-6 flex-col gap-1">
          <h2 className="font-serif text-2xl text-faint">{l}</h2>
          <EntryList entries={items} />
        </section>
      ))}
    </div>
  );
}

const FAMILY_TITLES: Record<string, string> = {
  Booker: "Booker's seven basic plots",
  Polti: "Polti's thirty-six dramatic situations",
  Vogler: "Vogler's eight archetypes",
  More: "More archetypes",
};

// Polti entries carry their number as an alias, "Polti No. 12".
const poltiNumber = (e: Entry) => Number(e.aliases.find((a) => a.startsWith("Polti No."))?.slice(10) ?? 99);
const sortPolti = (items: Entry[]) => [...items].sort((a, b) => poltiNumber(a) - poltiNumber(b));
