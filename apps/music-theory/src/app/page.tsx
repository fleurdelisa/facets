"use client";

import { useMemo, useState } from "react";
import CircleOfFifths from "@/components/CircleOfFifths";
import { Card, Pill, PlayButton } from "@/components/ui";
import { playChord, playSequence } from "@/lib/audio";
import {
  CIRCLE_MAJORS,
  CIRCLE_MINORS,
  MODES,
  diatonicChords,
  keySignature,
  majorScale,
  midiToFreq,
  mod,
  modeSteps,
  pcToCircle,
  signatureNotes,
} from "@/lib/theory";

export default function CirclePage() {
  const [keyPos, setKeyPos] = useState(0);
  const [modeIdx, setModeIdx] = useState(0);
  const [chordIdx, setChordIdx] = useState<number | null>(null);

  const mode = MODES[modeIdx];
  const parent = useMemo(() => majorScale(keyPos), [keyPos]);
  const steps = useMemo(() => modeSteps(mode.degree), [mode.degree]);
  const scale = useMemo(() => parent.map((_, i) => parent[(mode.degree + i) % 7]), [parent, mode.degree]);
  const chords = useMemo(() => diatonicChords(scale, steps), [scale, steps]);
  const tonic = scale[0];
  const sig = keySignature(keyPos);

  const baseMidi = 60 + tonic.pc - (tonic.pc > 6 ? 12 : 0);
  const freqs = (semis: number[]) => semis.map((s) => midiToFreq(baseMidi + s));

  const select = (k: number, m: number) => {
    setKeyPos(mod(k, 12));
    setModeIdx(m);
    setChordIdx(null);
  };

  const stepPattern = steps.map((s, i) => ((i < 6 ? steps[i + 1] : 12) - s === 2 ? "W" : "H"));
  const chord = chordIdx === null ? null : chords[chordIdx];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Circle of Fifths</h1>
          <p className="text-sm text-muted">
            Each step clockwise is up a perfect fifth (7 semitones). Click a key, or a minor key in the inner ring.
          </p>
        </div>
        <CircleOfFifths
          keyPos={keyPos}
          tonicPos={pcToCircle(tonic.pc)}
          chordPcs={chord?.notes.map((n) => n.pc)}
          onSelectMajor={(k) => select(k, 0)}
          onSelectMinor={(k) => select(k, 5)}
        />
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted">
          <Legend swatch="var(--accent)">tonic</Legend>
          <Legend swatch="var(--accent-soft)">in the scale</Legend>
          <Legend swatch="none" dashed>
            closest keys (IV · I · V and ii · vi · iii)
          </Legend>
        </div>
      </div>

      <div className="space-y-4">
        <Card
          title="Key"
          aside={
            <div className="flex gap-1">
              <Pill onClick={() => select(keyPos - 1, modeIdx)} title="One step counter-clockwise (down a fifth)">
                ← 4th
              </Pill>
              <Pill onClick={() => select(keyPos + 1, modeIdx)} title="One step clockwise (up a fifth)">
                5th →
              </Pill>
            </div>
          }
        >
          <div className="text-3xl font-semibold tracking-tight">
            {tonic.name} {mode.alias && modeIdx !== 0 ? mode.alias.toLowerCase() : mode.name}
            {modeIdx === 0 && <span className="text-muted"> (major)</span>}
          </div>
          {modeIdx !== 0 && (
            <p className="mt-1 text-sm text-muted">
              Same notes as <b className="text-foreground">{CIRCLE_MAJORS[keyPos]} major</b>, starting on its{" "}
              {ordinal(mode.degree + 1)} note.
            </p>
          )}
          <p className="mt-1 text-sm text-muted">
            {sig.label}
            {signatureNotes(keyPos).length > 0 && <span className="ml-2 font-mono text-foreground">{signatureNotes(keyPos).join(" ")}</span>}
            <span className="mx-2">·</span>relative minor {CIRCLE_MINORS[keyPos]}m
          </p>
        </Card>

        <Card title="Mode">
          <div className="flex flex-wrap gap-1.5">
            {MODES.map((m, i) => (
              <Pill key={m.name} active={i === modeIdx} onClick={() => select(keyPos, i)} title={m.mood}>
                {m.name}
              </Pill>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">{mode.mood}</p>
        </Card>

        <Card title="Scale" aside={<PlayButton onClick={() => playSequence(freqs([...steps, 12]))}>Play scale</PlayButton>}>
          <div className="flex flex-wrap items-end gap-1">
            {scale.map((n, i) => (
              <div key={i} className="flex items-end">
                <button
                  type="button"
                  onClick={() => playSequence(freqs([steps[i]]))}
                  className={`flex h-12 w-11 flex-col items-center justify-center rounded-lg border text-base font-semibold transition-colors ${
                    i === 0 ? "border-accent bg-accent-soft" : "border-border hover:border-muted"
                  }`}
                >
                  {n.name}
                  <span className="text-[10px] font-normal text-muted">{i + 1}</span>
                </button>
                {i < 6 && <span className="w-4 pb-3.5 text-center font-mono text-[10px] text-muted">{stepPattern[i]}</span>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            W = whole step (2 semitones), H = half step (1). Pattern: <span className="font-mono">{stepPattern.join(" ")}</span>
          </p>
        </Card>

        <Card title="Chords in this key" aside={<span className="text-xs text-muted">click to hear and draw</span>}>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
            {chords.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setChordIdx(i);
                  playChord(freqs(c.semis));
                }}
                className={`rounded-lg border px-1 py-2 text-center transition-colors ${
                  chordIdx === i ? "border-foreground bg-foreground text-background" : "border-border hover:border-muted"
                }`}
              >
                <div className="font-serif text-sm">{c.roman}</div>
                <div className="text-sm font-semibold">{c.symbol}</div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            {chord
              ? `${chord.symbol} = ${chord.notes.map((n) => n.name).join(" – ")} (${chord.quality})`
              : "Each chord stacks every other note of the scale: 1-3-5."}
          </p>
        </Card>

        <Card title="The math">
          <p className="text-sm leading-relaxed">
            Number the 12 notes C=0, C♯=1, … B=11. The key at position <b>k</b> on the circle is note{" "}
            <span className="font-mono">7k mod 12</span>. For {CIRCLE_MAJORS[keyPos]}:{" "}
            <span className="font-mono">
              7 × {keyPos} = {7 * keyPos} → {7 * keyPos} mod 12 = {mod(7 * keyPos, 12)}
            </span>
            . Because 7 and 12 share no common factor, stepping by 7 visits all 12 notes before returning home.
            Any 7 neighbouring positions make up a major scale (the shaded shape).
          </p>
        </Card>
      </div>
    </div>
  );
}

function Legend({ swatch, dashed, children }: { swatch: string; dashed?: boolean; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-3 rounded-sm"
        style={{ background: swatch, border: dashed ? "1px dashed var(--muted)" : "1px solid var(--border)" }}
      />
      {children}
    </span>
  );
}

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
