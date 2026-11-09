import { places, type Place, type Ring } from "@/data/places";
import { Glyph } from "./Glyph";

// The garden as concentric beds: this site's sections closest to the center,
// the apps around them, and ideas (seeds) along the outer edge.

const RINGS: Record<Ring, { rx: number; ry: number; label: string }> = {
  garden: { rx: 165, ry: 110, label: "this site" },
  apps: { rx: 320, ry: 205, label: "apps" },
  ideas: { rx: 455, ry: 300, label: "ideas" },
};

type Positioned = Place & { x: number; y: number };

function layout(): Positioned[] {
  const out: Positioned[] = [];
  for (const ring of Object.keys(RINGS) as Ring[]) {
    const items = places.filter((p) => p.ring === ring);
    const { rx, ry } = RINGS[ring];
    const step = 360 / items.length;
    // Stagger each ring so nodes don't line up along the same spokes.
    const offset = ring === "garden" ? -90 : ring === "apps" ? -90 + step / 2 : -90 + step / 4;
    items.forEach((p, i) => {
      const a = ((offset + i * step) * Math.PI) / 180;
      out.push({ ...p, x: Math.round(rx * Math.cos(a)), y: Math.round(ry * Math.sin(a)) });
    });
  }
  return out;
}

/** A gently bent garden path from a to b. */
function pathBetween(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const bend = 0.18;
  return `M${a.x} ${a.y} Q ${Math.round(mx - dy * bend)} ${Math.round(my + dx * bend)} ${b.x} ${b.y}`;
}

function nearest(p: Positioned, among: Positioned[]) {
  return among.reduce((best, q) => (Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(best.x - p.x, best.y - p.y) ? q : best));
}

export function GardenMap() {
  const nodes = layout();
  const core = { x: 0, y: 0 };
  const apps = nodes.filter((n) => n.ring === "apps");

  return (
    <figure className="map-figure">
      <svg
        className="map-svg"
        viewBox="-520 -345 1040 700"
        role="img"
        aria-label="A map of the garden: this site's sections at the center, apps around them, and ideas along the edge. The same places are listed below."
      >
        {(Object.keys(RINGS) as Ring[]).map((r) => (
          <g key={r}>
            <ellipse className="ring" rx={RINGS[r].rx} ry={RINGS[r].ry} />
            <text className="ring-label" x={RINGS[r].rx * 0.71 + 6} y={-RINGS[r].ry * 0.71 - 6}>
              {RINGS[r].label}
            </text>
          </g>
        ))}

        {nodes.map((n) => {
          const from = n.ring === "ideas" ? nearest(n, apps) : core;
          return <path key={`p-${n.id}`} className={`path ${n.stage}`} d={pathBetween(from, n)} />;
        })}

        <g>
          <circle className="core" r="44" />
          <text className="core-label" textAnchor="middle" dy="5">
            you are here
          </text>
        </g>

        {nodes.map((n) => {
          const inner = (
            <>
              <title>{`${n.name}: ${n.blurb}`}</title>
              <g transform={`translate(${n.x} ${n.y})`}>
                <circle r="22" fill="transparent" />
                <Glyph stage={n.stage} size={n.stage === "seed" ? 1 : 1.25} />
                <text textAnchor="middle" y={n.stage === "seed" ? 26 : 36}>
                  {n.name}
                </text>
              </g>
            </>
          );
          if (n.url) {
            return (
              <a key={n.id} className={`node ${n.stage}`} href={n.url}>
                {inner}
              </a>
            );
          }
          return (
            <g key={n.id} className={`node ${n.stage}`}>
              {inner}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
