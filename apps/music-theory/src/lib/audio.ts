// A tiny Web Audio synth. Everything is driven by raw frequencies so microtonal pitches play exactly.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): { ctx: AudioContext; out: GainNode } {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.5;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, out: master! };
}

export type Timbre = "sine" | "soft";

function voice(freq: number, start: number, dur: number, level: number, timbre: Timbre) {
  const { ctx, out } = audio();
  const osc = ctx.createOscillator();
  osc.type = timbre === "sine" ? "sine" : "triangle";
  osc.frequency.value = freq;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = Math.min(4000, freq * 6);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(level, start + 0.015);
  env.gain.exponentialRampToValueAtTime(level * 0.6, start + 0.2);
  env.gain.setValueAtTime(level * 0.6, start + Math.max(0.2, dur - 0.08));
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.25);
  osc.connect(filter).connect(env).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.3);
}

/** Play notes one after another. */
export function playSequence(freqs: number[], { step = 0.32, dur = 0.38, timbre = "soft" as Timbre } = {}) {
  const { ctx } = audio();
  const t0 = ctx.currentTime + 0.03;
  freqs.forEach((f, i) => voice(f, t0 + i * step, dur, 0.35, timbre));
}

/** Play notes together. */
export function playChord(freqs: number[], { dur = 1.2, timbre = "soft" as Timbre, strum = 0.02 } = {}) {
  const { ctx } = audio();
  const t0 = ctx.currentTime + 0.03;
  const level = 0.4 / Math.sqrt(freqs.length);
  freqs.forEach((f, i) => voice(f, t0 + i * strum, dur, level, timbre));
}

/** A sustained set of sine tones whose frequencies can be changed live (for hearing beats). */
export class Drone {
  private oscs: OscillatorNode[] = [];
  private gain: GainNode | null = null;

  start(freqs: number[]) {
    this.stop();
    const { ctx, out } = audio();
    this.gain = ctx.createGain();
    this.gain.gain.setValueAtTime(0, ctx.currentTime);
    this.gain.gain.linearRampToValueAtTime(0.3 / Math.sqrt(freqs.length), ctx.currentTime + 0.08);
    this.gain.connect(out);
    this.oscs = freqs.map((f) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(this.gain!);
      o.start();
      return o;
    });
  }

  set(freqs: number[]) {
    if (!ctx) return;
    freqs.forEach((f, i) => this.oscs[i]?.frequency.setTargetAtTime(f, ctx!.currentTime, 0.02));
  }

  stop() {
    if (!ctx || !this.gain) return;
    const g = this.gain;
    const oscs = this.oscs;
    g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    oscs.forEach((o) => o.stop(ctx!.currentTime + 0.2));
    this.oscs = [];
    this.gain = null;
  }
}
