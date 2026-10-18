import HarmonicSeries from "@/components/HarmonicSeries";
import IntervalWaves from "@/components/IntervalWaves";

export const metadata = { title: "Sound & Math · Music Theory" };

export default function MathPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sound & Math</h1>
        <p className="text-sm text-muted">
          Why some notes fit together: frequencies, whole-number ratios, and the harmonic series.
        </p>
      </div>
      <IntervalWaves />
      <HarmonicSeries />
      <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
        <b className="text-foreground">Cents, in one line:</b> musicians measure intervals in <i>cents</i>.{" "}
        <span className="font-mono text-foreground">cents = 1200 × log₂(f₂ / f₁)</span>. An octave (×2) is 1200¢ and a piano
        semitone is exactly 100¢. Most people notice a difference of about 5–10¢. The East Asian Scales page uses cents to
        compare tunings.
      </div>
    </div>
  );
}
