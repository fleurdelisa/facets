"use client";

import type { Scale } from "@/data/scales";

export const countryColor = (s: Scale) => `var(--${s.country})`;
const DASHES = ["", "6 4", "2 3", "10 3 2 3", "1 5"];

const ang = (c: number) => ((c / 1200) * 360 - 90) * (Math.PI / 180);
const at = (c: number, r: number) => [+(r * Math.cos(ang(c))).toFixed(2), +(r * Math.sin(ang(c))).toFixed(2)] as const;

/** One octave wrapped into a circle: 0¢ at the top, 600¢ at the bottom. The grey ticks are the 12 piano keys. */
export function ScaleClock({ scales, onPick }: { scales: Scale[]; onPick: (s: Scale, i: number) => void }) {
  const R = 150;
  return (
    <svg viewBox="-185 -185 370 370" className="mx-auto w-full max-w-[420px]" role="img" aria-label="Scales drawn on a pitch circle">
      <circle r={R} style={{ fill: "var(--card)", stroke: "var(--border)" }} />
      {Array.from({ length: 12 }, (_, i) => {
        const [x0, y0] = at(i * 100, R - 6);
        const [x1, y1] = at(i * 100, R + 6);
        const [lx, ly] = at(i * 100, R + 20);
        return (
          <g key={i}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} style={{ stroke: "var(--muted)", strokeWidth: 1.5 }} />
            <text x={lx} y={ly + 4} textAnchor="middle" className="font-mono text-[10px]" style={{ fill: "var(--muted)" }}>
              {i * 100}
            </text>
          </g>
        );
      })}
      {scales.map((s, si) => {
        const r = R - 14 - si * 4;
        const pts = s.cents.map((c) => at(c, r));
        return (
          <g key={s.id}>
            {Object.entries(s.ranges ?? {}).map(([i, [lo, hi]]) => {
              const [ax, ay] = at(lo, r);
              const [bx, by] = at(hi, r);
              return (
                <path
                  key={i}
                  d={`M ${ax} ${ay} A ${r} ${r} 0 0 1 ${bx} ${by}`}
                  style={{ fill: "none", stroke: countryColor(s), strokeWidth: 9, strokeLinecap: "round", opacity: 0.25 }}
                />
              );
            })}
            <polygon
              points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
              style={{
                fill: countryColor(s),
                fillOpacity: scales.length > 1 ? 0.06 : 0.14,
                stroke: countryColor(s),
                strokeWidth: 2,
                strokeDasharray: DASHES[si % DASHES.length],
                strokeLinejoin: "round",
              }}
            />
            {pts.map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={4.5}
                onClick={() => onPick(s, i)}
                className="cursor-pointer"
                style={{ fill: countryColor(s), stroke: "var(--card)", strokeWidth: 1.5 }}
              >
                <title>{`${s.name}: ${s.degrees[i]} = ${s.cents[i]}¢`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** Each scale on a straight 0–1200¢ line, with how far each note sits from the nearest piano key. */
export function CentsRuler({ scales, onPick }: { scales: Scale[]; onPick: (s: Scale, i: number) => void }) {
  const W = 640;
  const L = 130;
  const ROW = 46;
  const x = (c: number) => L + (c / 1200) * (W - L - 12);
  const H = scales.length * ROW + 24;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Scales on a cents ruler">
      {Array.from({ length: 13 }, (_, i) => (
        <g key={i}>
          <line x1={x(i * 100)} x2={x(i * 100)} y1={14} y2={H} style={{ stroke: "var(--border)", strokeWidth: i % 12 === 0 ? 1.5 : 1 }} />
          <text x={x(i * 100)} y={10} textAnchor="middle" className="font-mono text-[9px]" style={{ fill: "var(--muted)" }}>
            {i * 100}
          </text>
        </g>
      ))}
      {scales.map((s, si) => {
        const y = 24 + si * ROW + ROW / 2 - 6;
        return (
          <g key={s.id}>
            <text x={0} y={y - 2} className="text-[12px] font-semibold" style={{ fill: countryColor(s) }}>
              {s.name.length > 17 ? s.name.slice(0, 16) + "…" : s.name}
            </text>
            <text x={0} y={y + 12} className="text-[10px]" style={{ fill: "var(--muted)" }}>
              {s.native}
            </text>
            <line x1={x(0)} x2={x(1200)} y1={y} y2={y} style={{ stroke: countryColor(s), strokeOpacity: 0.35 }} />
            {Object.entries(s.ranges ?? {}).map(([i, [lo, hi]]) => (
              <rect key={i} x={x(lo)} y={y - 6} width={x(hi) - x(lo)} height={12} rx={6} style={{ fill: countryColor(s), opacity: 0.2 }} />
            ))}
            {s.cents.map((c, i) => {
              const dev = c - Math.round(c / 100) * 100;
              return (
                <g key={i} onClick={() => onPick(s, i)} className="cursor-pointer">
                  <circle cx={x(c)} cy={y} r={5.5} style={{ fill: countryColor(s), stroke: "var(--card)", strokeWidth: 1.5 }} />
                  <text x={x(c)} y={y - 9} textAnchor="middle" className="text-[9px]" style={{ fill: "var(--foreground)" }}>
                    {s.degrees[i].split(" ")[0]}
                  </text>
                  {dev !== 0 && (
                    <text x={x(c)} y={y + 17} textAnchor="middle" className="font-mono text-[9px]" style={{ fill: "var(--muted)" }}>
                      {dev > 0 ? "+" : ""}
                      {dev}
                    </text>
                  )}
                  <title>{`${s.degrees[i]}: ${c}¢ (${dev === 0 ? "exactly on a piano key" : `${dev > 0 ? "+" : ""}${dev}¢ from the piano`})`}</title>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
