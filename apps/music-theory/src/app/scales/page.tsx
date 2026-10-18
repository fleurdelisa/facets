"use client";

import { useMemo, useState } from "react";
import { Card, Pill, PlayButton } from "@/components/ui";
import { CentsRuler, ScaleClock, countryColor } from "@/components/ScaleViews";
import { COUNTRIES, SCALES, TUNING_LABEL, scaleById, type Scale } from "@/data/scales";
import { playSequence } from "@/lib/audio";
import { centsToRatio, midiToFreq } from "@/lib/theory";

const ROOTS = [
  { label: "C", midi: 60 },
  { label: "D", midi: 62 },
  { label: "E", midi: 64 },
  { label: "G", midi: 55 },
  { label: "A", midi: 57 },
];
const MAX_COMPARE = 5;
const SAME_SHAPE_TOLERANCE = 25;

/** Other scales that use the same set of intervals, possibly starting from a different note (a "rotation"). */
function relatives(scale: Scale): { scale: Scale; rotation: number }[] {
  const out: { scale: Scale; rotation: number }[] = [];
  for (const other of SCALES) {
    if (other.id === scale.id || other.cents.length !== scale.cents.length) continue;
    const n = scale.cents.length;
    for (let r = 0; r < n; r++) {
      const rotated = scale.cents.map((_, i) => {
        const c = scale.cents[(r + i) % n] - scale.cents[r];
        return c < 0 ? c + 1200 : c;
      });
      if (rotated.every((c, i) => Math.abs(c - other.cents[i]) <= SAME_SHAPE_TOLERANCE)) {
        out.push({ scale: other, rotation: r });
        break;
      }
    }
  }
  return out;
}

export default function ScalesPage() {
  const [compare, setCompare] = useState<string[]>(["cn-zhi", "jp-in", "kr-pyeongjo", "vn-bac"]);
  const [focusId, setFocusId] = useState("vn-bac");
  const [root, setRoot] = useState(ROOTS[0]);
  const [view, setView] = useState<"ruler" | "circle">("ruler");

  const focus = scaleById(focusId)!;
  const compared = compare.map(scaleById).filter((s): s is Scale => !!s);
  const kin = useMemo(() => relatives(focus), [focus]);

  const rootHz = midiToFreq(root.midi);
  const freqsOf = (s: Scale, snap = false) =>
    [...s.cents, 1200].map((c) => rootHz * centsToRatio(snap ? Math.round(c / 100) * 100 : c));

  const toggleCompare = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-MAX_COMPARE)));

  const pick = (s: Scale, i: number) => {
    setFocusId(s.id);
    playSequence([rootHz * centsToRatio(s.cents[i])], { dur: 0.7 });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">East Asian Scales</h1>
        <p className="max-w-3xl text-sm text-muted">
          Scales from China, Japan, Korea and Vietnam, plotted in cents (100¢ = one piano semitone). Many share the same
          five-note skeleton, but each tradition tunes and bends it differently. Select up to {MAX_COMPARE} to overlay.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card
          title="Compare"
          aside={
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill active={view === "ruler"} onClick={() => setView("ruler")}>
                Ruler
              </Pill>
              <Pill active={view === "circle"} onClick={() => setView("circle")}>
                Pitch circle
              </Pill>
              <span className="ml-2 text-xs text-muted">Root</span>
              {ROOTS.map((r) => (
                <Pill key={r.label} active={r.label === root.label} onClick={() => setRoot(r)}>
                  {r.label}
                </Pill>
              ))}
            </div>
          }
        >
          {compared.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Add scales from the library below.</p>
          ) : view === "ruler" ? (
            <CentsRuler scales={compared} onPick={pick} />
          ) : (
            <ScaleClock scales={compared} onPick={pick} />
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {compared.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-border py-0.5 pl-2 pr-1 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: countryColor(s) }} />
                <button type="button" onClick={() => setFocusId(s.id)} className="hover:underline">
                  {s.name}
                </button>
                <button type="button" onClick={() => playSequence(freqsOf(s))} className="px-1 text-accent" title="Play">
                  ▶
                </button>
                <button type="button" onClick={() => toggleCompare(s.id)} className="px-1 text-muted hover:text-foreground" title="Remove">
                  ×
                </button>
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            {view === "ruler"
              ? "Small numbers under each dot show how many cents it sits above (+) or below (−) the nearest piano key. Shaded bands are notes that float in performance."
              : "The octave wrapped into a circle. Grey ticks are the 12 piano keys. Two scales with the same polygon shape, turned, are modes of each other."}{" "}
            Click a dot to hear it.
          </p>
        </Card>

        <Card title="Selected scale">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xl font-semibold" style={{ color: countryColor(focus) }}>
                {focus.name}
              </div>
              <div className="text-sm text-muted">
                {focus.native} · {COUNTRIES.find((c) => c.id === focus.country)!.label}
              </div>
            </div>
            <span className="rounded-full bg-background px-2 py-0.5 text-[11px] text-muted">{TUNING_LABEL[focus.tuning]}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{focus.about}</p>

          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="font-normal">Degree</th>
                <th className="text-right font-normal">Cents</th>
                <th className="text-right font-normal">Nearest key</th>
                <th className="text-right font-normal">Off by</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {focus.cents.map((c, i) => {
                const near = Math.round(c / 100);
                const dev = c - near * 100;
                return (
                  <tr key={i} className="border-t border-border">
                    <td className="py-1 font-sans">
                      <button type="button" className="hover:underline" onClick={() => pick(focus, i)}>
                        {focus.degrees[i]}
                      </button>
                    </td>
                    <td className="text-right">{c}</td>
                    <td className="text-right">+{near} st</td>
                    <td className={`text-right ${Math.abs(dev) >= 10 ? "text-accent" : "text-muted"}`}>
                      {dev === 0 ? "·" : `${dev > 0 ? "+" : ""}${dev}¢`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-3 flex flex-wrap gap-2">
            <PlayButton onClick={() => playSequence(freqsOf(focus))}>Play</PlayButton>
            <PlayButton onClick={() => playSequence(freqsOf(focus, true))} title="Every note rounded to the nearest piano key">
              Piano version
            </PlayButton>
            {!compare.includes(focus.id) && (
              <Pill onClick={() => toggleCompare(focus.id)}>+ Compare</Pill>
            )}
          </div>

          {kin.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <div className="text-[11px] uppercase tracking-wider text-muted">Same shape (within {SAME_SHAPE_TOLERANCE}¢)</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {kin.map(({ scale, rotation }) => (
                  <button
                    key={scale.id}
                    type="button"
                    onClick={() => setFocusId(scale.id)}
                    className="rounded-full border border-border px-2.5 py-0.5 text-xs hover:border-muted"
                  >
                    <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: countryColor(scale) }} />
                    {scale.name}
                    <span className="text-muted">{rotation === 0 ? " (same start)" : `, starting on note ${rotation + 1}`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Library">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {COUNTRIES.map((country) => (
            <div key={country.id}>
              <h3 className="mb-2 flex items-baseline gap-2 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--${country.id})` }} />
                {country.label}
                <span className="text-sm font-normal text-muted">{country.native}</span>
              </h3>
              <ul className="space-y-1">
                {SCALES.filter((s) => s.country === country.id).map((s) => {
                  const on = compare.includes(s.id);
                  return (
                    <li
                      key={s.id}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${s.id === focusId ? "bg-background" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleCompare(s.id)}
                        aria-label={`Compare ${s.name}`}
                        className="accent-[var(--accent)]"
                      />
                      <button type="button" onClick={() => setFocusId(s.id)} className="flex-1 text-left hover:underline">
                        {s.name} <span className="text-xs text-muted">{s.native !== s.name ? s.native : ""}</span>
                      </button>
                      <button type="button" onClick={() => playSequence(freqsOf(s))} className="text-accent" title={`Play ${s.name}`}>
                        ▶
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          About the tunings: Chinese, Korean court and Japanese gagaku scales are shown in their traditional fifth-based
          tuning (三分损益 / 삼분손익), which is close to Pythagorean. Folk scales are shown on the piano grid, as they are
          usually transcribed, although singers bend them freely. The Vietnamese Bắc values are measured; Oán is an
          approximation, because its pitches vary by performer and region.
        </p>
      </Card>
    </div>
  );
}
