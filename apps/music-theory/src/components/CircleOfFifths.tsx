"use client";

import {
  CIRCLE_MAJORS,
  CIRCLE_MAJOR_ENHARMONIC,
  CIRCLE_MINORS,
  CIRCLE_MINOR_ENHARMONIC,
  mod,
  pcToCircle,
} from "@/lib/theory";

const R_OUT = 210;
const R_MID = 150;
const R_IN = 100;
const R_POLY = 86;

const angle = (k: number) => ((k * 30 - 90) * Math.PI) / 180;
// rounded so server- and client-rendered SVG attributes match exactly
const pt = (k: number, r: number) => [+(r * Math.cos(angle(k))).toFixed(2), +(r * Math.sin(angle(k))).toFixed(2)] as const;

function sector(k: number, r0: number, r1: number) {
  const a0 = angle(k - 0.5);
  const a1 = angle(k + 0.5);
  const p = (a: number, r: number) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  return `M ${p(a0, r1)} A ${r1} ${r1} 0 0 1 ${p(a1, r1)} L ${p(a1, r0)} A ${r0} ${r0} 0 0 0 ${p(a0, r0)} Z`;
}

export interface CircleProps {
  /** selected major key (circle position) */
  keyPos: number;
  /** circle position of the current tonic (differs from keyPos for modes) */
  tonicPos: number;
  /** pitch classes of the highlighted chord */
  chordPcs?: number[];
  onSelectMajor: (k: number) => void;
  onSelectMinor: (k: number) => void;
}

export default function CircleOfFifths({ keyPos, tonicPos, chordPcs, onSelectMajor, onSelectMinor }: CircleProps) {
  const inScale = (k: number) => mod(k - keyPos + 1, 12) <= 6;
  const near = (k: number) => Math.abs(mod(k - keyPos + 6, 12) - 6) <= 1;
  const scalePoints = Array.from({ length: 7 }, (_, i) => pt(keyPos - 1 + i, R_POLY));
  const chordPoints = chordPcs?.map((pc) => pt(pcToCircle(pc), R_POLY));

  return (
    <svg viewBox="-225 -225 450 450" className="mx-auto w-full max-w-[520px] select-none" role="img" aria-label="Circle of fifths">
      {Array.from({ length: 12 }, (_, k) => {
        const tonic = k === tonicPos;
        const [lx, ly] = pt(k, (R_OUT + R_MID) / 2);
        const [mx, my] = pt(k, (R_MID + R_IN) / 2);
        const alt = CIRCLE_MAJOR_ENHARMONIC[k];
        const minorAlt = CIRCLE_MINOR_ENHARMONIC[k];
        return (
          <g key={k}>
            <path
              d={sector(k, R_MID, R_OUT)}
              onClick={() => onSelectMajor(k)}
              className="cursor-pointer transition-[fill] duration-300"
              style={{
                fill: tonic ? "var(--accent)" : inScale(k) ? "var(--accent-soft)" : "var(--ring-a)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
            />
            <path
              d={sector(k, R_IN, R_MID)}
              onClick={() => onSelectMinor(k)}
              className="cursor-pointer transition-[fill] duration-300"
              style={{
                fill: near(k) ? "var(--ring-b)" : "var(--ring-a)",
                stroke: "var(--background)",
                strokeWidth: 2,
                opacity: near(k) ? 1 : 0.7,
              }}
            />
            <text
              x={lx}
              y={ly + (alt ? -4 : 6)}
              textAnchor="middle"
              className="pointer-events-none text-[17px] font-semibold"
              style={{ fill: tonic ? "#fff" : "var(--foreground)", opacity: inScale(k) || tonic ? 1 : 0.45 }}
            >
              {CIRCLE_MAJORS[k]}
            </text>
            {alt && (
              <text x={lx} y={ly + 13} textAnchor="middle" className="pointer-events-none text-[11px]" style={{ fill: tonic ? "#fff" : "var(--muted)" }}>
                {alt}
              </text>
            )}
            <text
              x={mx}
              y={my + (minorAlt ? -2 : 5)}
              textAnchor="middle"
              className="pointer-events-none text-[13px]"
              style={{ fill: "var(--foreground)", opacity: near(k) ? 0.95 : 0.45 }}
            >
              {CIRCLE_MINORS[k]}m
            </text>
            {minorAlt && (
              <text x={mx} y={my + 11} textAnchor="middle" className="pointer-events-none text-[10px]" style={{ fill: "var(--muted)" }}>
                {minorAlt}m
              </text>
            )}
          </g>
        );
      })}

      {/* the neighbourhood of the selected key: IV I V on the outside, ii vi iii inside */}
      <path
        d={`${sector(keyPos - 1, R_IN, R_OUT)} ${sector(keyPos, R_IN, R_OUT)} ${sector(keyPos + 1, R_IN, R_OUT)}`}
        className="pointer-events-none"
        style={{ fill: "none", stroke: "var(--foreground)", strokeWidth: 1, strokeDasharray: "3 4", opacity: 0.4 }}
      />

      <circle r={R_IN - 4} style={{ fill: "var(--card)" }} />
      {Array.from({ length: 12 }, (_, k) => {
        const [x, y] = pt(k, R_POLY);
        return <circle key={k} cx={x} cy={y} r={2.5} style={{ fill: "var(--muted)", opacity: 0.5 }} />;
      })}
      <polygon
        points={scalePoints.map(([x, y]) => `${x},${y}`).join(" ")}
        className="transition-all duration-300"
        style={{ fill: "var(--accent)", fillOpacity: 0.12, stroke: "var(--accent)", strokeWidth: 1.5, strokeLinejoin: "round" }}
      />
      {chordPoints && (
        <polygon
          points={chordPoints.map(([x, y]) => `${x},${y}`).join(" ")}
          style={{ fill: "var(--foreground)", fillOpacity: 0.12, stroke: "var(--foreground)", strokeWidth: 2, strokeLinejoin: "round" }}
        />
      )}
      {(() => {
        const [x, y] = pt(tonicPos, R_POLY);
        return <circle cx={x} cy={y} r={5} style={{ fill: "var(--accent)" }} />;
      })()}
    </svg>
  );
}
