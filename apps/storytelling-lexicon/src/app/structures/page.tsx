import type { Metadata } from "next";
import Link from "next/link";
import { listStructures, type StructureWithBeats } from "@/lib/glossary";

export const metadata: Metadata = { title: "Structures compared" };

// Short beats get a minimum display width so their label fits; the darker
// strip under each label still shows the beat's real span.
const MIN_WIDTH = 0.09;
const LANE_REM = 3.25;

type Placed = StructureWithBeats["beats"][number] & { left: number; width: number; lane: number };

function layout(beats: StructureWithBeats["beats"]): { placed: Placed[]; lanes: number } {
  const laneEnds: number[] = [];
  const placed = [...beats]
    .sort((a, b) => a.story_start - b.story_start || a.position - b.position)
    .map((b) => {
      const width = Math.max(b.story_end - b.story_start, MIN_WIDTH);
      const left = Math.min(b.story_start, 1 - width);
      let lane = laneEnds.findIndex((end) => end <= left + 0.001);
      if (lane === -1) lane = laneEnds.push(0) - 1;
      laneEnds[lane] = left + width;
      return { ...b, left, width, lane };
    });
  return { placed, lanes: laneEnds.length };
}

export default async function StructuresPage() {
  const structures = await listStructures();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex max-w-2xl flex-col gap-2" data-layer="structure">
        <p className="eyebrow">Structures compared</p>
        <h1 className="font-serif text-4xl font-medium">Same story, different maps</h1>
        <p className="text-lg text-muted">
          Each structure laid on one timeline, from the first page to the last. Spans are rough — Save the Cat&apos;s come from
          Snyder&apos;s page targets, the rest are conventional placements.
        </p>
      </header>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="relative min-w-[720px]" data-layer="structure">
          <div className="pointer-events-none absolute inset-0 flex">
            {[0, 1, 2, 3].map((q) => (
              <div key={q} className="flex-1 border-l border-dashed border-rule first:border-l-0" />
            ))}
          </div>
          <div className="relative flex justify-between pb-2 text-[0.65rem] text-faint tabular-nums">
            {["start", "25%", "50%", "75%", "end"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>

          <div className="relative flex flex-col gap-6">
            {structures.map(({ structure, beats }) => {
              const { placed, lanes } = layout(beats);
              return (
                <section key={structure.id} className="flex flex-col gap-1.5">
                  <Link href={`/entry/${structure.slug}`} className="self-start bg-paper pr-2 font-serif text-lg font-medium hover:text-layer">
                    {structure.name}
                    <span className="ml-2 font-sans text-xs font-normal text-faint">{structure.family}</span>
                  </Link>
                  <div className="relative" style={{ height: `${lanes * LANE_REM}rem` }}>
                    {placed.map((b) => (
                      <Link
                        key={b.id}
                        href={`/entry/${b.slug}`}
                        title={`${b.name} — ${b.summary}`}
                        className="bg-layer-soft absolute flex h-12 flex-col justify-between overflow-hidden rounded-md border border-transparent px-1.5 pt-1 hover:border-layer"
                        style={{ left: `${b.left * 100}%`, width: `calc(${b.width * 100}% - 3px)`, top: `${b.lane * LANE_REM}rem` }}
                      >
                        <span className="line-clamp-2 text-[0.7rem] leading-tight">{b.name}</span>
                        <span className="relative -mx-1.5 h-1">
                          <span
                            className="bg-layer absolute inset-y-0 rounded-full"
                            style={{
                              left: `${((b.story_start - b.left) / b.width) * 100}%`,
                              width: `${Math.max(((b.story_end - b.story_start) / b.width) * 100, 6)}%`,
                            }}
                          />
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
