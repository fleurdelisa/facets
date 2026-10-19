// Fortune over time as a smooth line. Points are in [-1, 1], evenly spaced.
export function ArcChart({ points, className, labelled = false }: { points: number[]; className?: string; labelled?: boolean }) {
  const w = 200;
  const h = 80;
  const pad = 6;
  const xy = points.map((p, i) => [pad + (i / (points.length - 1)) * (w - pad * 2), h / 2 - p * (h / 2 - pad)]);

  // Catmull-Rom → cubic Bézier for a hand-drawn feel.
  let d = `M ${xy[0][0]} ${xy[0][1]}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const [p0, p1, p2, p3] = [xy[i - 1] ?? xy[i], xy[i], xy[i + 1], xy[i + 2] ?? xy[i + 1]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }

  const svg = (
    <svg viewBox={`0 0 ${w} ${h}`} className={labelled ? "h-full w-full" : className} role="img" aria-label="Fortune over the course of the story" preserveAspectRatio="none">
      <line x1={pad} x2={w - pad} y1={h / 2} y2={h / 2} stroke="var(--rule)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke="var(--layer, var(--accent))" strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
  if (!labelled) return svg;

  // Labels live outside the SVG so the stretched viewBox doesn't distort them.
  return (
    <div className={`relative ${className ?? ""}`}>
      {svg}
      <span className="absolute top-2 left-3 text-[0.65rem] text-faint">good fortune</span>
      <span className="absolute bottom-2 left-3 text-[0.65rem] text-faint">ill fortune</span>
      <span className="absolute right-3 bottom-2 text-[0.65rem] text-faint">beginning → end</span>
    </div>
  );
}
