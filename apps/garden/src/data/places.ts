// Everything that shows up on the garden map.
//
// stage:
//   bloom: live, and the map links to it
//   bud:   being built (has a branch or an open PR), not deployed yet
//   seed:  an idea in gallery/*/intention.md
//
// When an app goes live, set its stage to "bloom" and fill in its url.

export type Stage = "bloom" | "bud" | "seed";
export type Ring = "garden" | "apps" | "ideas";

export type Place = {
  id: string;
  name: string;
  blurb: string;
  stage: Stage;
  ring: Ring;
  /** Internal path ("/blog") or full URL ("https://skills.fleurdelisa.dev") */
  url?: string;
};

export const places: Place[] = [
  // Inside this site
  { id: "blog", name: "Blog", blurb: "Thoughts and musings", stage: "bloom", ring: "garden", url: "/blog" },
  { id: "recipes", name: "Recipe Box", blurb: "Recipes shared with friends and family", stage: "bloom", ring: "garden", url: "/recipes" },
  { id: "experiments", name: "Experiments", blurb: "Interactive art and explorations", stage: "bloom", ring: "garden", url: "/experiments" },

  // Apps in facets/apps, each on its own subdomain
  { id: "skill-tree", name: "Skill Tree", blurb: "Everything I've invested time in learning, as a game skill tree", stage: "bud", ring: "apps" },
  { id: "commonplace", name: "Commonplace", blurb: "Quotes worth keeping, from books, podcasts, films and more", stage: "bud", ring: "apps" },
  { id: "music-theory", name: "Music Theory", blurb: "The circle of fifths, the math of sound, and East Asian scales", stage: "bud", ring: "apps" },
  { id: "storytelling", name: "Storytelling Lexicon", blurb: "A glossary of plots, arcs, archetypes, tropes and devices", stage: "bud", ring: "apps" },
  { id: "etymology", name: "Etymology Map", blurb: "Where the world's words come from, on a map", stage: "bud", ring: "apps" },

  // Ideas from gallery/
  { id: "art-styles", name: "Art Styles", blurb: "A visual dictionary of art styles", stage: "seed", ring: "ideas" },
  { id: "camping", name: "Campsite", blurb: "A cozy 3D campsite and packing list", stage: "seed", ring: "ideas" },
  { id: "fengshui", name: "Feng Shui", blurb: "The elements and the energy they bring", stage: "seed", ring: "ideas" },
  { id: "gastronomy", name: "Gastronomy", blurb: "Foods indexed by their attributes and heatiness", stage: "seed", ring: "ideas" },
  { id: "library", name: "Library", blurb: "My books, tagged with NFC, with notes and quotes", stage: "seed", ring: "ideas" },
  { id: "music", name: "Sound Visualizer", blurb: "Visualizations of a song's pitch, volume and tempo", stage: "seed", ring: "ideas" },
  { id: "photography", name: "Manual Camera", blurb: "Learn aperture, ISO and shutter on a 3D camera", stage: "seed", ring: "ideas" },
];

export const stageLabels: Record<Stage, { name: string; meaning: string }> = {
  bloom: { name: "In bloom", meaning: "Live. Click to visit" },
  bud: { name: "Budding", meaning: "Being built" },
  seed: { name: "Seeds", meaning: "Ideas, not started" },
};
