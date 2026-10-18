# music-theory

A free-form explorer for learning music theory through sound and math.

- **Circle of Fifths** (`/`): pick a key and mode to see its scale, key signature, and diatonic chords. Each chord is drawn as a shape on the circle and plays when clicked.
- **Sound & Math** (`/math`): intervals as frequency ratios, shown as waveforms and Lissajous figures, with pure vs. piano (12-TET) tuning. Also the harmonic series, shown as a vibrating string and on linear vs. octave scales.
- **East Asian Scales** (`/scales`): Chinese, Japanese, Korean and Vietnamese scales in true cents. Overlay them on a ruler or a pitch circle, play them, hear them snapped to the piano, and find scales that share the same shape.

All sound comes from a small Web Audio synth (`src/lib/audio.ts`), so microtonal pitches play exactly.

## Develop

```bash
pnpm install
pnpm dev   # http://localhost:3002
```

## Where things live

- `src/lib/theory.ts`: pitch classes, note spelling, circle-of-fifths math, modes, chords, ratios
- `src/data/scales.ts`: scale data and the notes on how each one is tuned
- `src/components/`: the circle, the waveform and harmonic views, and the scale ruler and pitch circle

## Ideas for later

Piano keyboard and guitar fretboard views. Both can reuse `theory.ts` pitch classes.
