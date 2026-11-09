import type { Stage } from "@/data/places";

/** A flower, bud or seed drawn around (0, 0). Use inside an <svg>. */
export function Glyph({ stage, size = 1 }: { stage: Stage; size?: number }) {
  if (stage === "bloom") {
    return (
      <g className="glyph glyph-bloom" transform={`scale(${size})`}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} className="petal" cx="0" cy="-8" rx="6" ry="9" transform={`rotate(${a})`} />
        ))}
        <circle className="heart" r="5" />
      </g>
    );
  }
  if (stage === "bud") {
    return (
      <g className="glyph glyph-bud" transform={`scale(${size})`}>
        <path className="stem" d="M0 12 Q -2 4 0 -2" />
        <path className="stem" d="M-1 7 Q -8 4 -9 -1" />
        <path className="bud" d="M0 -14 C 7 -8 7 0 0 2 C -7 0 -7 -8 0 -14 Z" />
      </g>
    );
  }
  return (
    <g className="glyph glyph-seed" transform={`scale(${size})`}>
      <ellipse className="seed" rx="4.5" ry="6.5" transform="rotate(-25)" />
    </g>
  );
}

export function GlyphIcon({ stage }: { stage: Stage }) {
  return (
    <svg width="22" height="22" viewBox="-16 -16 32 32" aria-hidden="true">
      <Glyph stage={stage} size={0.9} />
    </svg>
  );
}
