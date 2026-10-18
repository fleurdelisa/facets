"use client";

import { geoGraticule10, geoNaturalEarth1, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { select } from "d3-selection";
import "d3-transition";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import {
  countryName,
  isRtl,
  languageName,
  readCountry,
  type CountryReading,
  type Word,
} from "@/lib/etymology";

type CountryFeature = Feature<Polygon | MultiPolygon, { name: string }>;

const topology = world as unknown as Topology<{
  countries: GeometryCollection<{ name: string }>;
}>;
const COUNTRY_FEATURES = (
  feature(topology, topology.objects.countries) as FeatureCollection<
    Polygon | MultiPolygon,
    { name: string }
  >
).features.filter((f) => f.properties.name !== "Antarctica") as CountryFeature[];

const SPHERE = { type: "Sphere" } as GeoPermissibleObjects;
const GRATICULE = geoGraticule10();
const NO_DATA = "var(--land-empty)";
const MIN_LABEL_PX = 8;
const MAX_LABEL_PX = 20;

interface Shape {
  name: string;
  d: string;
  // Label anchor and room, from the country's largest polygon.
  cx: number;
  cy: number;
  w: number;
  h: number;
}

function largestPolygon(f: CountryFeature, path: ReturnType<typeof geoPath>): Feature<Polygon> {
  if (f.geometry.type === "Polygon") return f as Feature<Polygon>;
  let best: Feature<Polygon> | null = null;
  let bestArea = -1;
  for (const coordinates of f.geometry.coordinates) {
    const poly: Feature<Polygon> = {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates },
    };
    const area = path.area(poly);
    if (area > bestArea) {
      bestArea = area;
      best = poly;
    }
  }
  return best!;
}

/** Rough width of a label in ems; CJK and Hangul glyphs are about square. */
function emWidth(text: string): number {
  let w = 0;
  for (const ch of text) w += /[\u2E80-\u9FFF\uAC00-\uD7AF\u3040-\u30FF]/.test(ch) ? 1 : 0.6;
  return Math.max(w, 1);
}

interface WorldMapProps {
  word: Word;
  romanized: boolean;
  highlight: string | null;
}

export default function WorldMap({ word, romanized, highlight }: WorldMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { shapes, spherePath, graticulePath } = useMemo(() => {
    if (!size.w || !size.h) return { shapes: [], spherePath: "", graticulePath: "" };
    const projection = geoNaturalEarth1().fitExtent(
      [
        [12, 12],
        [size.w - 12, size.h - 12],
      ],
      { type: "FeatureCollection", features: COUNTRY_FEATURES },
    );
    const path = geoPath(projection);
    const shapes: Shape[] = COUNTRY_FEATURES.map((f) => {
      const main = largestPolygon(f, path);
      const [cx, cy] = path.centroid(main);
      const [[x0, y0], [x1, y1]] = path.bounds(main);
      return { name: f.properties.name, d: path(f) ?? "", cx, cy, w: x1 - x0, h: y1 - y0 };
    });
    return { shapes, spherePath: path(SPHERE) ?? "", graticulePath: path(GRATICULE) ?? "" };
  }, [size.w, size.h]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !size.w) return;
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .translateExtent([
        [0, 0],
        [size.w, size.h],
      ])
      .on("zoom", (e) => setTransform(e.transform));
    zoomRef.current = behavior;
    select(svg).call(behavior).on("dblclick.zoom", null);
    return () => {
      select(svg).on(".zoom", null);
    };
  }, [size.w, size.h]);

  const zoomBy = (factor: number) => {
    const svg = svgRef.current;
    if (svg && zoomRef.current) select(svg).transition().duration(300).call(zoomRef.current.scaleBy, factor);
  };
  const resetZoom = () => {
    const svg = svgRef.current;
    if (svg && zoomRef.current)
      select(svg).transition().duration(400).call(zoomRef.current.transform, zoomIdentity);
  };

  const readings = useMemo(() => {
    const out: Record<string, CountryReading | undefined> = {};
    for (const s of shapes) out[s.name] = readCountry(word, s.name);
    return out;
  }, [shapes, word]);

  const k = transform.k;

  // Size each label to its country, then place greedily from largest to
  // smallest, dropping any that would overlap one already placed.
  const labels = useMemo(() => {
    const candidates = [];
    for (const s of shapes) {
      const r = readings[s.name];
      if (!r?.form || !r.etymon) continue;
      if (highlight !== null && r.etymon.id !== highlight) continue;
      const text = romanized ? (r.form.roman ?? r.form.native) : r.form.native;
      const em = emWidth(text);
      const px = Math.min(MAX_LABEL_PX, (s.w * k * 0.85) / em, s.h * k * 0.5);
      if (px < MIN_LABEL_PX) continue;
      candidates.push({
        name: s.name,
        text,
        px,
        x: s.cx,
        y: s.cy,
        halfW: (px * em) / 2 + 2,
        halfH: px * 0.6,
        rtl: !romanized && isRtl(r.form.lang),
      });
    }
    candidates.sort((a, b) => b.px - a.px);
    const placed: typeof candidates = [];
    for (const c of candidates) {
      const clash = placed.some(
        (p) =>
          Math.abs(p.x - c.x) * k < p.halfW + c.halfW &&
          Math.abs(p.y - c.y) * k < p.halfH + c.halfH,
      );
      if (!clash) placed.push(c);
    }
    return placed;
  }, [shapes, readings, highlight, romanized, k]);
  const hovered = hover ? readings[hover.name] : undefined;

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        className="block cursor-grab active:cursor-grabbing"
        onPointerLeave={() => setHover(null)}
      >
        <g transform={transform.toString()}>
          <path d={spherePath} fill="var(--ocean)" />
          <path
            d={graticulePath}
            fill="none"
            stroke="var(--graticule)"
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
          />
          {shapes.map((s) => {
            const etymon = readings[s.name]?.etymon;
            const dimmed = highlight !== null && etymon?.id !== highlight;
            return (
              <path
                key={s.name}
                d={s.d}
                fill={etymon?.color ?? NO_DATA}
                fillOpacity={dimmed ? 0.18 : 1}
                stroke="var(--border)"
                strokeWidth={hover?.name === s.name ? 1.6 : 0.5}
                vectorEffect="non-scaling-stroke"
                className="country"
                onPointerMove={(e) => {
                  const box = wrapRef.current!.getBoundingClientRect();
                  setHover({ name: s.name, x: e.clientX - box.left, y: e.clientY - box.top });
                }}
              />
            );
          })}
          <g className="pointer-events-none">
            {labels.map((l) => (
              <text
                key={l.name}
                x={l.x}
                y={l.y}
                fontSize={l.px / k}
                strokeWidth={3 / k}
                direction={l.rtl ? "rtl" : "ltr"}
                className="map-label"
              >
                {l.text}
              </text>
            ))}
          </g>
        </g>
      </svg>

      <div className="absolute top-4 right-4 flex flex-col gap-1">
        <MapButton label="Zoom in" onClick={() => zoomBy(1.6)}>
          +
        </MapButton>
        <MapButton label="Zoom out" onClick={() => zoomBy(1 / 1.6)}>
          −
        </MapButton>
        <MapButton label="Reset view" onClick={resetZoom}>
          ⟲
        </MapButton>
      </div>

      {hover && (
        <Tooltip
          x={hover.x}
          y={hover.y}
          width={size.w}
          height={size.h}
          name={countryName(hover.name)}
          reading={hovered}
        />
      )}
    </div>
  );
}

function MapButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--line)] bg-[var(--paper-raised)]/90 text-lg text-[var(--ink-soft)] shadow-sm backdrop-blur transition hover:text-[var(--ink)]"
    >
      {children}
    </button>
  );
}

function Tooltip({
  x,
  y,
  width,
  height,
  name,
  reading,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  reading: CountryReading | undefined;
}) {
  const left = x > width - 260 ? x - 250 : x + 16;
  const top = y > height - 140 ? y - 120 : y + 16;
  const form = reading?.form;
  const etymon = reading?.etymon;
  return (
    <div
      className="pointer-events-none absolute z-10 w-[234px] rounded-xl border border-[var(--line)] bg-[var(--paper-raised)] px-3.5 py-3 text-sm shadow-lg"
      style={{ left, top }}
    >
      <div className="text-[11px] tracking-[0.12em] text-[var(--ink-faint)] uppercase">{name}</div>
      {form && etymon ? (
        <>
          <div className="mt-1 font-serif text-2xl leading-tight text-[var(--ink)]" dir="auto">
            {form.native}
          </div>
          {form.roman && form.roman !== form.native && (
            <div className="text-[var(--ink-soft)] italic">{form.roman}</div>
          )}
          <div className="mt-1 text-xs text-[var(--ink-faint)]">{languageName(form.lang)}</div>
          <div className="mt-2 flex items-start gap-2 border-t border-[var(--line)] pt-2">
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: etymon.color }}
            />
            <span className="text-xs leading-snug text-[var(--ink-soft)]">
              <span className="font-medium text-[var(--ink)]">{etymon.label}</span>
              {etymon.note && <> · {etymon.note}</>}
            </span>
          </div>
        </>
      ) : (
        <div className="mt-1 text-xs text-[var(--ink-faint)]">
          No data yet for {languageName(reading?.primaryLang ?? "")}
        </div>
      )}
    </div>
  );
}
