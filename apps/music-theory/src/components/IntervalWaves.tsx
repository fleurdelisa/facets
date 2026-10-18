"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Pill } from "@/components/ui";
import { Drone } from "@/lib/audio";
import { INTERVAL_RATIOS, centsToRatio, ratioToCents } from "@/lib/theory";

const BASE = 220;
const W = 600;

export default function IntervalWaves() {
  const [idx, setIdx] = useState(7);
  const [equal, setEqual] = useState(false);
  const [detune, setDetune] = useState(0);
  const [playing, setPlaying] = useState(false);
  const drone = useRef<Drone | null>(null);

  const iv = INTERVAL_RATIOS[idx];
  const ideal = iv.p / iv.q;
  const ratio = (equal ? Math.pow(2, iv.semis / 12) : ideal) * centsToRatio(detune);
  const f1 = BASE;
  const f2 = BASE * ratio;
  const drift = f2 - ideal * f1; // Hz away from the perfect ratio
  const offCents = ratioToCents(ratio / ideal);

  useEffect(() => {
    if (playing) drone.current?.set([f1, f2]);
  }, [f1, f2, playing]);
  useEffect(() => () => drone.current?.stop(), []);

  const toggle = () => {
    drone.current ??= new Drone();
    if (playing) drone.current.stop();
    else drone.current.start([f1, f2]);
    setPlaying(!playing);
  };

  return (
    <Card title="Intervals as ratios">
      <p className="mb-3 text-sm text-muted">
        Two notes sound smooth together when their frequencies make a simple ratio. A perfect 5th is 3:2: the upper
        note vibrates 3 times while the lower vibrates 2 times, so the combined wave repeats in a short, regular pattern.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {INTERVAL_RATIOS.map((r, i) => (
          <Pill key={r.name} active={i === idx} onClick={() => setIdx(i)}>
            {r.name} <span className="font-mono text-[11px] opacity-70">{r.p}:{r.q}</span>
          </Pill>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex gap-1">
          <Pill active={!equal} onClick={() => setEqual(false)}>
            Pure ratio
          </Pill>
          <Pill active={equal} onClick={() => setEqual(true)} title="The tuning used on a modern piano">
            Piano (12-TET)
          </Pill>
        </div>
        <label className="flex items-center gap-2">
          <span className="text-muted">Detune</span>
          <input type="range" min={-40} max={40} value={detune} onChange={(e) => setDetune(+e.target.value)} className="accent-[var(--accent)]" />
          <span className="w-12 font-mono">{detune > 0 ? "+" : ""}{detune}¢</span>
        </label>
        <button
          type="button"
          onClick={toggle}
          className={`rounded-full px-4 py-1.5 font-medium ${playing ? "bg-foreground text-background" : "bg-accent text-white dark:text-black"}`}
        >
          {playing ? "■ Stop" : "▶ Hold both notes"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <Waves f1={f1} f2={f2} q={iv.q} exact={Math.abs(drift) < 1e-9} />
        <Lissajous ratioP={iv.p} ratioQ={iv.q} drift={drift} />
      </div>

      <div className="mt-3 grid gap-2 rounded-xl bg-background p-3 text-sm sm:grid-cols-3">
        <Stat label="Frequencies" value={`${f1.toFixed(1)} & ${f2.toFixed(2)} Hz`} />
        <Stat label="Off the pure ratio" value={`${offCents >= 0 ? "+" : ""}${offCents.toFixed(1)}¢`} />
        <Stat
          label={iv.p === 1 && iv.q === 1 ? "Beats per second" : "Pattern drifts every"}
          value={
            Math.abs(drift) < 1e-6
              ? "never: locked"
              : iv.p === 1 && iv.q === 1
                ? `${Math.abs(drift).toFixed(2)}`
                : `${(1 / Math.abs(iv.q * drift)).toFixed(1)} s`
          }
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        Hold the notes and try the piano tuning on a major 3rd: it is about 14¢ wider than 5:4, so the sound has a fast
        shimmer. For a unison, nudge Detune to hear <i>beats</i>: the volume pulses as many times per second as the two
        frequencies differ in hertz.
      </p>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="font-mono">{value}</div>
    </div>
  );
}

function Waves({ f1, f2, q, exact }: { f1: number; f2: number; q: number; exact: boolean }) {
  const cycles = Math.min(Math.max(2 * q, 4), 10);
  const T = cycles / f1;
  const paths = useMemo(() => {
    const mk = (fn: (t: number) => number) =>
      Array.from({ length: 601 }, (_, i) => {
        const t = (i / 600) * T;
        return `${i ? "L" : "M"}${(i / 600) * W} ${(-fn(t) * 16).toFixed(2)}`;
      }).join("");
    return {
      a: mk((t) => Math.sin(2 * Math.PI * f1 * t)),
      b: mk((t) => Math.sin(2 * Math.PI * f2 * t)),
      sum: mk((t) => Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t)),
    };
  }, [f1, f2, T]);
  const repeats = exact ? Array.from({ length: Math.floor(cycles / q) + 1 }, (_, i) => (i * q * W) / cycles) : [];

  return (
    <svg viewBox="-4 -24 608 190" className="w-full">
      {repeats.map((x) => (
        <line key={x} x1={x} x2={x} y1={-22} y2={164} style={{ stroke: "var(--accent)", strokeDasharray: "3 3", opacity: 0.6 }} />
      ))}
      <Row y={0} d={paths.a} label="low note" color="var(--muted)" />
      <Row y={45} d={paths.b} label="high note" color="var(--muted)" />
      <Row y={115} d={paths.sum} label="what you hear (sum)" color="var(--accent)" scale={1.4} />
    </svg>
  );
}

function Row({ y, d, label, color, scale = 1 }: { y: number; d: string; label: string; color: string; scale?: number }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <line x1={0} x2={W} y1={0} y2={0} style={{ stroke: "var(--border)" }} />
      <path d={d} transform={`scale(1 ${scale})`} style={{ fill: "none", stroke: color, strokeWidth: 1.6, vectorEffect: "non-scaling-stroke" }} />
      <text x={2} y={scale > 1 ? -49 : -18} className="text-[10px]" style={{ fill: "var(--muted)" }}>
        {label}
      </text>
    </g>
  );
}

/** x = low note, y = high note. A pure ratio traces a still figure; any mistuning makes it slowly turn. */
function Lissajous({ ratioP, ratioQ, drift }: { ratioP: number; ratioQ: number; drift: number }) {
  const ref = useRef<SVGPathElement>(null);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const steps = 600;
    const draw = (now: number) => {
      const phase = 2 * Math.PI * drift * ((now - start) / 1000);
      let d = "";
      for (let i = 0; i <= steps; i++) {
        const s = (i / steps) * 2 * Math.PI * ratioQ;
        const x = Math.sin(s);
        const y = Math.sin((ratioP / ratioQ) * s + phase + Math.PI / 4);
        d += `${i ? "L" : "M"}${(x * 90).toFixed(1)} ${(-y * 90).toFixed(1)}`;
      }
      ref.current?.setAttribute("d", d);
      if (drift !== 0) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ratioP, ratioQ, drift]);

  return (
    <div>
      <svg viewBox="-100 -100 200 200" className="mx-auto w-full max-w-[220px] rounded-xl bg-background">
        <path ref={ref} style={{ fill: "none", stroke: "var(--accent)", strokeWidth: 1.2 }} />
      </svg>
      <p className="mt-1 text-center text-xs text-muted">Lissajous figure: still means in tune</p>
    </div>
  );
}
