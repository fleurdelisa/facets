import Link from "next/link";
import type { Entry } from "@/lib/types";
import { ArcChart } from "./arc-chart";
import { LayerBadge } from "./layer-badge";

export function EntryCard({ entry, showLayer = true }: { entry: Entry; showLayer?: boolean }) {
  return (
    <Link
      href={`/entry/${entry.slug}`}
      data-layer={entry.layer}
      className="group flex flex-col gap-1.5 rounded-xl border border-rule bg-card p-4 transition-colors hover:border-layer"
    >
      <div className="flex items-center justify-between gap-2">
        {showLayer ? <LayerBadge layer={entry.layer} /> : <span />}
        {entry.owner_id && <span className="eyebrow">yours</span>}
      </div>
      <h3 className="font-serif text-lg leading-snug font-medium group-hover:text-layer">{entry.name}</h3>
      {entry.arc_points && <ArcChart points={entry.arc_points} className="h-14 w-full" />}
      <p className="text-sm leading-relaxed text-muted">{entry.summary}</p>
    </Link>
  );
}

export function EntryList({ entries }: { entries: Entry[] }) {
  return (
    <ul className="divide-y divide-rule">
      {entries.map((e) => (
        <li key={e.id} data-layer={e.layer}>
          <Link href={`/entry/${e.slug}`} className="group flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:gap-4">
            <span className="font-serif text-base font-medium group-hover:text-layer sm:w-64 sm:shrink-0">
              {e.name}
              {e.owner_id && <span className="eyebrow ml-2">yours</span>}
            </span>
            <span className="text-sm text-muted">{e.summary}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
