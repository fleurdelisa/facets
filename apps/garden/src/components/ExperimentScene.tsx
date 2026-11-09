"use client";

import dynamic from "next/dynamic";

// Interactive pieces that go with an experiment's Markdown page, keyed by its slug.
// Each loads only in the browser, and only on its own page.
const scenes: Record<string, React.ComponentType> = {
  "three-js-starter": dynamic(() => import("./experiments/SpinningCube"), { ssr: false }),
};

export function ExperimentScene({ slug }: { slug: string }) {
  const Scene = scenes[slug];
  return Scene ? <Scene /> : null;
}
