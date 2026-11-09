import { GardenMap } from "@/components/GardenMap";
import { GlyphIcon } from "@/components/Glyph";
import { places, stageLabels, type Stage } from "@/data/places";

const STAGES: Stage[] = ["bloom", "bud", "seed"];

export default function Home() {
  return (
    <div className="map-page">
      <section className="map-intro">
        <p className="eyebrow">A digital garden</p>
        <h1>Everything I&rsquo;m growing</h1>
        <p>
          My personal space for seeds of thought and budding projects. Some things here are in full bloom, some are still
          being built, and some are only ideas. Wander and discover as you go.
        </p>
      </section>

      <GardenMap />

      <ul className="legend" aria-hidden="true">
        {STAGES.map((s) => (
          <li key={s}>
            <GlyphIcon stage={s} /> {stageLabels[s].name}
          </li>
        ))}
      </ul>

      <div className="plots">
        {STAGES.map((s) => (
          <section key={s} aria-labelledby={`plot-${s}`}>
            <h2 id={`plot-${s}`}>
              <GlyphIcon stage={s} /> {stageLabels[s].name}
            </h2>
            <p className="muted">{stageLabels[s].meaning}</p>
            <ul>
              {places
                .filter((p) => p.stage === s)
                .map((p) => (
                  <li key={p.id}>
                    <strong>{p.url ? <a href={p.url}>{p.name}</a> : p.name}</strong>
                    <span>{p.blurb}</span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
