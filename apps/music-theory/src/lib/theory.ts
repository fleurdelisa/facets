// Core 12-tone theory: pitch classes, spelling, the circle of fifths, modes and diatonic chords.

export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

export const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

export const MODES = [
  { name: "Ionian", alias: "Major", degree: 0, mood: "bright, resolved" },
  { name: "Dorian", alias: "", degree: 1, mood: "minor with a lifted 6th" },
  { name: "Phrygian", alias: "", degree: 2, mood: "dark, Spanish-tinged ♭2" },
  { name: "Lydian", alias: "", degree: 3, mood: "dreamy, floating ♯4" },
  { name: "Mixolydian", alias: "", degree: 4, mood: "bluesy major with ♭7" },
  { name: "Aeolian", alias: "Natural minor", degree: 5, mood: "sad, classic minor" },
  { name: "Locrian", alias: "", degree: 6, mood: "unstable, diminished 5th" },
] as const;

export const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Position k on the circle of fifths holds pitch class 7k mod 12. 7 is its own inverse mod 12, so the reverse is the same map. */
export const circleToPc = (k: number) => mod(7 * k, 12);
export const pcToCircle = (pc: number) => mod(7 * pc, 12);

/** Major key tonic at each circle position (sharps clockwise, flats counter-clockwise). */
export const CIRCLE_MAJORS = ["C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭", "B♭", "F"];
export const CIRCLE_MAJOR_ENHARMONIC: Record<number, string> = { 5: "C♭", 6: "G♭", 7: "C♯" };
export const CIRCLE_MINORS = ["A", "E", "B", "F♯", "C♯", "G♯", "D♯", "B♭", "F", "C", "G", "D"];
export const CIRCLE_MINOR_ENHARMONIC: Record<number, string> = { 6: "E♭", 5: "A♭" };

export function keySignature(k: number): { count: number; type: "sharps" | "flats" | "none"; label: string } {
  if (k === 0) return { count: 0, type: "none", label: "no sharps or flats" };
  if (k <= 6) return { count: k, type: "sharps", label: `${k} sharp${k > 1 ? "s" : ""}` };
  const n = 12 - k;
  return { count: n, type: "flats", label: `${n} flat${n > 1 ? "s" : ""}` };
}

const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
export function signatureNotes(k: number): string[] {
  const sig = keySignature(k);
  if (sig.type === "sharps") return SHARP_ORDER.slice(0, sig.count).map((l) => l + "♯");
  if (sig.type === "flats") return [...SHARP_ORDER].reverse().slice(0, sig.count).map((l) => l + "♭");
  return [];
}

export interface SpelledNote {
  name: string;
  pc: number;
}

function parseName(name: string): { letterIdx: number; acc: number } {
  const letterIdx = LETTERS.indexOf(name[0] as (typeof LETTERS)[number]);
  let acc = 0;
  for (const ch of name.slice(1)) acc += ch === "♯" ? 1 : ch === "♭" ? -1 : 0;
  return { letterIdx, acc };
}

const accidental = (n: number) => (n > 0 ? "♯".repeat(n) : "♭".repeat(-n)).replace("♯♯", "𝄪").replace("♭♭", "𝄫");

export function pcOf(name: string): number {
  const { letterIdx, acc } = parseName(name);
  return mod(LETTER_PC[letterIdx] + acc, 12);
}

/** Spell a 7-note scale so every letter is used once (the way it's written on a staff). */
export function spellHeptatonic(tonic: string, steps: number[]): SpelledNote[] {
  const { letterIdx } = parseName(tonic);
  const tonicPc = pcOf(tonic);
  return steps.map((s, d) => {
    const li = (letterIdx + d) % 7;
    const pc = mod(tonicPc + s, 12);
    let acc = mod(pc - LETTER_PC[li], 12);
    if (acc > 6) acc -= 12;
    return { name: LETTERS[li] + accidental(acc), pc };
  });
}

export const majorScale = (k: number) => spellHeptatonic(CIRCLE_MAJORS[k], MAJOR_STEPS);

/** Steps (semitones from the mode's own tonic) for a mode starting on a given degree of the major scale. */
export function modeSteps(degree: number): number[] {
  return MAJOR_STEPS.map((_, i) => mod(MAJOR_STEPS[(degree + i) % 7] - MAJOR_STEPS[degree], 12));
}

export type Quality = "major" | "minor" | "diminished" | "augmented";

export interface Chord {
  roman: string;
  symbol: string;
  quality: Quality;
  notes: SpelledNote[];
  /** semitones above the mode tonic, ascending, for playback */
  semis: number[];
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

/** The seven triads built by stacking every-other scale note (1-3-5) on each degree. */
export function diatonicChords(scale: SpelledNote[], steps: number[]): Chord[] {
  return scale.map((root, d) => {
    const idx = [d, d + 2, d + 4];
    const semis = idx.map((i) => steps[i % 7] + 12 * Math.floor(i / 7));
    const third = semis[1] - semis[0];
    const fifth = semis[2] - semis[0];
    const quality: Quality =
      third === 4 ? (fifth === 8 ? "augmented" : "major") : fifth === 6 ? "diminished" : "minor";
    const altered = steps[d] - MAJOR_STEPS[d];
    const prefix = altered < 0 ? "♭" : altered > 0 ? "♯" : "";
    const base = quality === "major" || quality === "augmented" ? ROMAN[d] : ROMAN[d].toLowerCase();
    const suffix = quality === "diminished" ? "°" : quality === "augmented" ? "+" : "";
    const symSuffix = quality === "minor" ? "m" : quality === "diminished" ? "°" : quality === "augmented" ? "+" : "";
    return {
      roman: prefix + base + suffix,
      symbol: root.name + symSuffix,
      quality,
      notes: idx.map((i) => scale[i % 7]),
      semis,
    };
  });
}

export const PC_NAMES_SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

export const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
export const centsToRatio = (cents: number) => Math.pow(2, cents / 1200);
export const ratioToCents = (ratio: number) => 1200 * Math.log2(ratio);

/** Nearest 12-TET note to a frequency, and how many cents off it is. */
export function nearestNote(freq: number): { name: string; octave: number; cents: number } {
  const midiFloat = 69 + 12 * Math.log2(freq / 440);
  const midi = Math.round(midiFloat);
  return {
    name: PC_NAMES_SHARP[mod(midi, 12)],
    octave: Math.floor(midi / 12) - 1,
    cents: Math.round((midiFloat - midi) * 100),
  };
}

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export const INTERVAL_RATIOS: { name: string; p: number; q: number; semis: number }[] = [
  { name: "Unison", p: 1, q: 1, semis: 0 },
  { name: "Minor 2nd", p: 16, q: 15, semis: 1 },
  { name: "Major 2nd", p: 9, q: 8, semis: 2 },
  { name: "Minor 3rd", p: 6, q: 5, semis: 3 },
  { name: "Major 3rd", p: 5, q: 4, semis: 4 },
  { name: "Perfect 4th", p: 4, q: 3, semis: 5 },
  { name: "Tritone", p: 45, q: 32, semis: 6 },
  { name: "Perfect 5th", p: 3, q: 2, semis: 7 },
  { name: "Minor 6th", p: 8, q: 5, semis: 8 },
  { name: "Major 6th", p: 5, q: 3, semis: 9 },
  { name: "Harmonic 7th", p: 7, q: 4, semis: 10 },
  { name: "Minor 7th", p: 9, q: 5, semis: 10 },
  { name: "Major 7th", p: 15, q: 8, semis: 11 },
  { name: "Octave", p: 2, q: 1, semis: 12 },
];

export function intervalName(p: number, q: number): string | undefined {
  const g = gcd(p, q);
  let a = p / g;
  let b = q / g;
  // fold into a single octave so 3:1 reads as "fifth (+ octave)"
  let octaves = 0;
  while (a / b > 2) {
    b *= 2;
    octaves++;
  }
  const g2 = gcd(a, b);
  a /= g2;
  b /= g2;
  const hit = INTERVAL_RATIOS.find((r) => r.p === a && r.q === b);
  if (!hit) return undefined;
  return octaves ? `${hit.name} + ${octaves} octave${octaves > 1 ? "s" : ""}` : hit.name;
}
