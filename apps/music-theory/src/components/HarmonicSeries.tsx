"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Pill, PlayButton } from "@/components/ui";
import { playChord, playSequence } from "@/lib/audio";
import { gcd, intervalName, nearestNote, ratioToCents } from "@/lib/theory";

const FUNDAMENTALS = [
  { label: "C2", hz: 65.41 },
  { label: "A2", hz: 110 },
  { label: "C3", hz: 130.81 },
];
const N = 16;

export default function HarmonicSeries() {
  const [f0, setF0] = useState(FUNDAMENTALS[1].hz);
  const [picked, setPicked] = useState<number[]>([2, 3]);
  const focus = picked[picked.length - 1] ?? 1;

  const toggle = (n: number) => {
    playSequence([n * f0], { timbre: "sine", dur: 0.8 });
    setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n].slice(-2)));
  };

  const [a, b] = [...picked].sort((x, y) => x - y);
  const g = a && b ? gcd(a, b) : 1;

  return (
    <Card
      title="The harmonic series"
      aside={
        <div className="flex flex-wrap items-center gap-1.5">
          {FUNDAMENTALS.map((f) => (
            <Pill key={f.label} active={f.hz === f0} onClick={() => setF0(f.hz)}>
              {f.label}
            </Pill>
          ))}
          <PlayButton onClick={() => playSequence(Array.from({ length: N }, (_, i) => (i + 1) * f0), { step: 0.22, dur: 0.3, timbre: "sine" })}>
            1 → 16
          </PlayButton>
        </div>
      }
    >
      <p className="mb-4 text-sm text-muted">
        A plucked string vibrates as a whole, and also in halves, thirds, quarters… at the same time. Each part sounds a
        whole-number multiple of the lowest frequency (the <i>fundamental</i>). These multiples are the building blocks of
        musical intervals.
      </p>

      <StandingWave n={focus} />

      <div className="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
        {Array.from({ length: N }, (_, i) => {
          const n = i + 1;
          const hz = n * f0;
          const note = nearestNote(hz);
          const on = picked.includes(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => toggle(n)}
              className={`rounded-lg border p-1.5 text-left transition-colors ${on ? "border-accent bg-accent-soft" : "border-border hover:border-muted"}`}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-semibold">{n}</span>
                <span className="font-mono text-[10px] text-muted">{Math.round(hz)} Hz</span>
              </div>
              <div className="text-xs">
                {note.name}
                {note.octave}
                <span className={`ml-1 font-mono ${Math.abs(note.cents) > 10 ? "text-accent" : "text-muted"}`}>
                  {note.cents > 0 ? "+" : ""}
                  {note.cents}¢
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl bg-background p-3 text-sm">
        {a && b ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              Harmonics <b>{b}</b> and <b>{a}</b>: ratio <span className="font-mono font-semibold">{b / g}:{a / g}</span>
              {intervalName(b, a) && (
                <>
                  {" "}
                  = <b>{intervalName(b, a)}</b>
                </>
              )}
              <span className="ml-2 font-mono text-muted">({Math.round(ratioToCents(b / a))}¢)</span>
            </div>
            <PlayButton onClick={() => playChord([a * f0, b * f0], { timbre: "sine", dur: 1.6 })}>Together</PlayButton>
          </div>
        ) : (
          <span className="text-muted">Pick two harmonics to see the interval between them.</span>
        )}
      </div>

      <FrequencyLadder f0={f0} picked={picked} />
      <p className="mt-3 text-xs text-muted">
        Cents in red are more than 10¢ away from the nearest piano key. Harmonics 7, 11, 13 and 14 have no good match on the piano.
      </p>
    </Card>
  );
}

function StandingWave({ n }: { n: number }) {
  const ref = useRef<SVGPathElement>(null);
  useEffect(() => {
    let raf = 0;
    const W = 600;
    const draw = (t: number) => {
      const amp = 26 * Math.cos(t / 180);
      let d = "";
      for (let i = 0; i <= 200; i++) {
        const x = (i / 200) * W;
        const y = amp * Math.sin((n * Math.PI * i) / 200);
        d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      ref.current?.setAttribute("d", d);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [n]);

  const env = (sign: number) =>
    Array.from({ length: 201 }, (_, i) => `${i ? "L" : "M"}${(i * 3).toFixed(1)} ${(sign * 26 * Math.sin((n * Math.PI * i) / 200)).toFixed(1)}`).join("");

  return (
    <div>
      <svg viewBox="-10 -36 620 72" className="w-full">
        <path d={env(1)} style={{ fill: "none", stroke: "var(--border)", strokeWidth: 1 }} />
        <path d={env(-1)} style={{ fill: "none", stroke: "var(--border)", strokeWidth: 1 }} />
        <path ref={ref} style={{ fill: "none", stroke: "var(--accent)", strokeWidth: 2.5 }} />
        {Array.from({ length: n + 1 }, (_, i) => (
          <circle key={i} cx={(i / n) * 600} cy={0} r={3} style={{ fill: "var(--foreground)" }} />
        ))}
      </svg>
      <p className="text-center text-xs text-muted">
        Harmonic {n}: the string splits into {n} equal part{n > 1 ? "s" : ""}, each vibrating {n}× as fast.
      </p>
    </div>
  );
}

function FrequencyLadder({ f0, picked }: { f0: number; picked: number[] }) {
  const W = 600;
  const rows = [
    { label: "In hertz (linear)", x: (n: number) => ((n - 1) / (N - 1)) * W },
    { label: "As you hear it (octaves)", x: (n: number) => (Math.log2(n) / Math.log2(N)) * W },
  ];
  return (
    <div className="mt-4 space-y-1">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="text-[11px] uppercase tracking-wider text-muted">{r.label}</div>
          <svg viewBox="-12 -14 624 30" className="w-full">
            <line x1={0} x2={W} y1={0} y2={0} style={{ stroke: "var(--border)" }} />
            {[1, 2, 4, 8, 16].map((o) => (
              <line key={o} x1={r.x(o)} x2={r.x(o)} y1={-8} y2={8} style={{ stroke: "var(--muted)", strokeDasharray: "2 2" }} />
            ))}
            {Array.from({ length: N }, (_, i) => {
              const n = i + 1;
              const on = picked.includes(n);
              return (
                <g key={n}>
                  <circle cx={r.x(n)} cy={0} r={on ? 5 : 3.5} style={{ fill: on ? "var(--accent)" : "var(--foreground)" }} />
                  <text x={r.x(n)} y={14} textAnchor="middle" className="text-[9px]" style={{ fill: "var(--muted)" }}>
                    {n}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ))}
      <p className="text-xs text-muted">
        Dashed lines mark octaves (×2) above {Math.round(f0)} Hz. In hertz the harmonics are evenly spaced. To the ear,
        each octave is the same size, so higher harmonics crowd together, and the gaps between them shrink into smaller
        and smaller intervals.
      </p>
    </div>
  );
}
