"use client";

/** Thickness of the ruler strips, in px. Mirrored as `--ruler` in globals.css. */
const T = 22;

const TICK_STEPS = [10, 20, 50, 100, 200, 500, 1000];
const LABEL_STEPS = [100, 200, 500, 1000, 2000, 5000];

interface Props {
  view: { x: number; y: number; k: number };
  size: { w: number; h: number };
}

function ticks(origin: number, k: number, from: number, to: number, step: number): number[] {
  const out: number[] = [];
  const first = Math.ceil((from - origin) / k / step) * step;
  for (let v = first; origin + v * k <= to; v += step) out.push(v);
  return out;
}

/**
 * Cutting-mat rulers along the top and left edges (light theme only). They
 * track pan and zoom; 0 is the self orb and each labelled unit is 100px of tree.
 */
export default function MatRulers({ view, size }: Props) {
  const step = TICK_STEPS.find((s) => s * view.k >= 7) ?? TICK_STEPS[TICK_STEPS.length - 1];
  const labelStep = LABEL_STEPS.find((s) => s * view.k >= 56) ?? LABEL_STEPS[LABEL_STEPS.length - 1];
  const len = (v: number) => (v % labelStep === 0 ? 11 : v % (step * 5) === 0 ? 7 : 4);
  const label = (v: number) => String(Math.abs(v / 100));

  const xs = ticks(view.x, view.k, T, size.w, step);
  const ys = ticks(view.y, view.k, T, size.h, step);

  return (
    <svg className="st-rulers" width={size.w} height={size.h} aria-hidden>
      <rect className="st-ruler-strip" x={T} y={0} width={size.w - T} height={T} />
      <rect className="st-ruler-strip" x={0} y={T} width={T} height={size.h - T} />
      <line className="st-ruler-edge" x1={T} y1={T - 0.5} x2={size.w} y2={T - 0.5} />
      <line className="st-ruler-edge" x1={T - 0.5} y1={T} x2={T - 0.5} y2={size.h} />

      {xs.map((v) => {
        const x = Math.round(view.x + v * view.k) + 0.5;
        return (
          <g key={`x${v}`}>
            <line className="st-ruler-tick" x1={x} y1={T} x2={x} y2={T - len(v)} />
            {v % labelStep === 0 && (
              <text className="st-ruler-label" x={x + 3} y={9}>
                {label(v)}
              </text>
            )}
          </g>
        );
      })}

      {ys.map((v) => {
        const y = Math.round(view.y + v * view.k) + 0.5;
        return (
          <g key={`y${v}`}>
            <line className="st-ruler-tick" x1={T} y1={y} x2={T - len(v)} y2={y} />
            {v % labelStep === 0 && (
              <text className="st-ruler-label" x={9} y={y + 3} transform={`rotate(-90 9 ${y + 3})`}>
                {label(v)}
              </text>
            )}
          </g>
        );
      })}

      <rect className="st-ruler-corner" x={0} y={0} width={T} height={T} />
      <path className="st-ruler-cross" d={`M ${T / 2 - 5} ${T / 2} H ${T / 2 + 5} M ${T / 2} ${T / 2 - 5} V ${T / 2 + 5}`} />
    </svg>
  );
}
