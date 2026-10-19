import type { SeedEntry, SeedRelation } from "./schema";

type Beat = {
  slug: string;
  name: string;
  summary: string;
  // Rough share of the story the beat spans, 0 = start, 1 = end.
  span: [number, number];
  aliases?: string[];
  tvtropes?: string;
};

type Structure = Omit<SeedEntry, "layer"> & { beats: Beat[] };

const structures: Structure[] = [
  {
    slug: "heros-journey",
    name: "The Hero's Journey",
    aliases: ["Monomyth"],
    family: "Campbell · Vogler",
    tvtropes: "Main/TheHerosJourney",
    summary: "A hero leaves the ordinary world, is tested and transformed in a special world, and returns with a gift.",
    source:
      "Joseph Campbell, The Hero with a Thousand Faces (1949); Christopher Vogler, The Writer's Journey (1992). Stages follow Vogler's twelve.",
    beats: [
      { slug: "ordinary-world", name: "The Ordinary World", span: [0, 0.08], summary: "The hero's normal life, before the adventure — what's at stake and what's missing." },
      { slug: "call-to-adventure", name: "Call to Adventure", span: [0.08, 0.12], tvtropes: "Main/CallToAdventure", summary: "A problem, challenge or invitation disrupts the ordinary world." },
      { slug: "refusal-of-the-call", name: "Refusal of the Call", span: [0.12, 0.17], tvtropes: "Main/RefusalOfTheCall", summary: "The hero hesitates or declines out of fear, duty or doubt." },
      { slug: "meeting-the-mentor", name: "Meeting the Mentor", span: [0.17, 0.22], summary: "A guide offers advice, training or a gift that prepares the hero." },
      { slug: "crossing-the-threshold", name: "Crossing the First Threshold", span: [0.22, 0.27], summary: "The hero commits and enters the special world; there's no easy way back." },
      { slug: "tests-allies-enemies", name: "Tests, Allies, Enemies", span: [0.27, 0.45], summary: "The hero learns the rules of the new world and finds out who to trust." },
      { slug: "approach-to-the-inmost-cave", name: "Approach to the Inmost Cave", span: [0.45, 0.5], summary: "Preparations for the central ordeal, at the most dangerous place." },
      { slug: "the-ordeal", name: "The Ordeal", span: [0.5, 0.6], summary: "The hero faces their greatest challenge yet, often a brush with death." },
      { slug: "the-reward", name: "Reward", aliases: ["Seizing the Sword"], span: [0.6, 0.7], summary: "Having survived, the hero claims a prize — an object, knowledge or reconciliation." },
      { slug: "the-road-back", name: "The Road Back", span: [0.7, 0.8], summary: "The hero sets out for home, often pursued by the consequences of the ordeal." },
      { slug: "the-resurrection", name: "Resurrection", span: [0.8, 0.92], summary: "A final, climactic test where the hero is purified and reborn." },
      { slug: "return-with-the-elixir", name: "Return with the Elixir", span: [0.92, 1], summary: "The hero comes home transformed, carrying something that benefits the ordinary world." },
    ],
  },
  {
    slug: "three-act-structure",
    name: "Three-Act Structure",
    family: "Classical",
    tvtropes: "Main/ThreeActStructure",
    summary: "Setup, confrontation, resolution — the default skeleton of most screen stories.",
    source: "After Aristotle's Poetics; popularised for film by Syd Field, Screenplay (1979)",
    beats: [
      { slug: "act-one-setup", name: "Act One: Setup", span: [0, 0.25], summary: "Introduce the world, the protagonist and the inciting incident; end on a turn that launches the story." },
      { slug: "act-two-confrontation", name: "Act Two: Confrontation", span: [0.25, 0.75], summary: "Rising obstacles and complications, turning at the midpoint, ending at the lowest point." },
      { slug: "act-three-resolution", name: "Act Three: Resolution", span: [0.75, 1], summary: "The climax and its aftermath, where the central question is answered." },
    ],
  },
  {
    slug: "freytags-pyramid",
    name: "Freytag's Pyramid",
    family: "Freytag",
    summary: "A five-part dramatic arc that rises to a central climax and falls to a resolution.",
    source: "Gustav Freytag, Die Technik des Dramas (1863)",
    beats: [
      { slug: "freytag-exposition", name: "Exposition", span: [0, 0.2], summary: "Background, setting and characters are established." },
      { slug: "freytag-rising-action", name: "Rising Action", span: [0.2, 0.45], summary: "Complications build tension toward the turning point." },
      { slug: "freytag-climax", name: "Climax", span: [0.45, 0.55], summary: "The turning point, where the protagonist's fortunes change direction." },
      { slug: "freytag-falling-action", name: "Falling Action", span: [0.55, 0.8], summary: "Consequences of the climax play out; tension unwinds." },
      { slug: "freytag-denouement", name: "Dénouement", aliases: ["Resolution", "Catastrophe"], span: [0.8, 1], summary: "Loose ends are tied up — a happy resolution, or in tragedy, the catastrophe." },
    ],
  },
  {
    slug: "save-the-cat",
    name: "Save the Cat! Beat Sheet",
    aliases: ["Blake Snyder Beat Sheet", "BS2"],
    family: "Snyder",
    summary: "Fifteen beats with page targets for a feature screenplay.",
    description:
      "Snyder pinned each beat to a page in a 110-page script — the catalyst on page 12, the break into Act Two on 25, the midpoint on 55, all is lost on 75. The spans here are those page targets as fractions of the whole.",
    source: "Blake Snyder, Save the Cat! (2005)",
    beats: [
      { slug: "stc-opening-image", name: "Opening Image", span: [0, 0.01], summary: "A snapshot of the hero's world and problem before anything changes." },
      { slug: "stc-theme-stated", name: "Theme Stated", span: [0.04, 0.05], summary: "Someone voices the story's lesson, usually before the hero understands it." },
      { slug: "stc-set-up", name: "Set-Up", span: [0.01, 0.09], summary: "The hero's life, flaws and the things that need fixing." },
      { slug: "stc-catalyst", name: "Catalyst", span: [0.1, 0.11], summary: "The life-changing event that knocks the hero out of the status quo." },
      { slug: "stc-debate", name: "Debate", span: [0.11, 0.23], summary: "The hero wrestles with whether to act." },
      { slug: "stc-break-into-two", name: "Break into Two", span: [0.23, 0.25], summary: "The hero makes a choice and enters the upside-down world of Act Two." },
      { slug: "stc-b-story", name: "B Story", span: [0.27, 0.3], summary: "A secondary story — often a relationship — that carries the theme." },
      { slug: "stc-fun-and-games", name: "Fun and Games", span: [0.27, 0.5], summary: "The promise of the premise: the scenes the poster sold." },
      { slug: "stc-midpoint", name: "Midpoint", span: [0.5, 0.51], summary: "A false victory or false defeat that raises the stakes." },
      { slug: "stc-bad-guys-close-in", name: "Bad Guys Close In", span: [0.5, 0.68], summary: "External pressure and internal doubt tighten around the hero." },
      { slug: "stc-all-is-lost", name: "All Is Lost", span: [0.68, 0.69], summary: "The lowest point, often with a 'whiff of death'." },
      { slug: "stc-dark-night-of-the-soul", name: "Dark Night of the Soul", span: [0.69, 0.77], summary: "The hero sits with the loss before finding a way forward." },
      { slug: "stc-break-into-three", name: "Break into Three", span: [0.77, 0.78], summary: "A new idea, born from the A and B stories, gives the hero the answer." },
      { slug: "stc-finale", name: "Finale", span: [0.78, 0.99], summary: "The hero applies the lesson and defeats the problem." },
      { slug: "stc-final-image", name: "Final Image", span: [0.99, 1], summary: "A mirror of the opening image, showing how much has changed." },
    ],
  },
  {
    slug: "kishotenketsu",
    name: "Kishōtenketsu",
    aliases: ["Qǐ chéng zhuǎn hé", "Four-act structure"],
    family: "East Asian",
    tvtropes: "Main/Kishotenketsu",
    summary: "A four-part structure built around a twist or juxtaposition rather than conflict.",
    source: "From classical Chinese four-line poetry; used widely in Japanese and Korean storytelling",
    beats: [
      { slug: "ki", name: "Ki (Introduction)", span: [0, 0.25], summary: "Introduce the characters and setting." },
      { slug: "sho", name: "Shō (Development)", span: [0.25, 0.5], summary: "Develop what was introduced, without major change." },
      { slug: "ten", name: "Ten (Twist)", span: [0.5, 0.75], summary: "An unexpected element or shift in perspective recasts what came before." },
      { slug: "ketsu", name: "Ketsu (Reconciliation)", span: [0.75, 1], summary: "The parts are brought together into a new understanding." },
    ],
  },
  {
    slug: "story-circle",
    name: "Story Circle",
    aliases: ["Dan Harmon's Story Circle", "Embryo"],
    family: "Harmon",
    summary: "An eight-step loop: a character wants something, goes and gets it, and comes back changed.",
    source: "Dan Harmon, adapted from Campbell's monomyth",
    beats: [
      { slug: "circle-you", name: "You", span: [0, 0.125], summary: "A character in a zone of comfort." },
      { slug: "circle-need", name: "Need", span: [0.125, 0.25], summary: "But they want something." },
      { slug: "circle-go", name: "Go", span: [0.25, 0.375], summary: "They enter an unfamiliar situation." },
      { slug: "circle-search", name: "Search", span: [0.375, 0.5], summary: "They adapt to it." },
      { slug: "circle-find", name: "Find", span: [0.5, 0.625], summary: "They get what they wanted." },
      { slug: "circle-take", name: "Take", span: [0.625, 0.75], summary: "They pay a heavy price for it." },
      { slug: "circle-return", name: "Return", span: [0.75, 0.875], summary: "They return to their familiar situation." },
      { slug: "circle-change", name: "Change", span: [0.875, 1], summary: "Having changed." },
    ],
  },
  {
    slug: "seven-point-structure",
    name: "Seven-Point Story Structure",
    family: "Wells",
    summary: "Seven plot points, designed by working backwards from the ending to the opposite state at the start.",
    source: "Dan Wells, after the Star Wars roleplaying game guide",
    beats: [
      { slug: "spt-hook", name: "Hook", span: [0, 0.05], summary: "The protagonist's starting state — the opposite of where they'll end." },
      { slug: "spt-plot-turn-1", name: "Plot Turn 1", span: [0.2, 0.25], summary: "The call to action that sets the story in motion." },
      { slug: "spt-pinch-1", name: "Pinch 1", span: [0.35, 0.4], summary: "Pressure is applied; the antagonist shows their strength." },
      { slug: "spt-midpoint", name: "Midpoint", span: [0.48, 0.52], summary: "The protagonist moves from reacting to acting." },
      { slug: "spt-pinch-2", name: "Pinch 2", span: [0.6, 0.65], summary: "More pressure — a plan fails, a mentor falls, everything seems lost." },
      { slug: "spt-plot-turn-2", name: "Plot Turn 2", span: [0.75, 0.8], summary: "The protagonist finds the final piece they need." },
      { slug: "spt-resolution", name: "Resolution", span: [0.9, 1], summary: "The climax and the end state, the mirror of the hook." },
    ],
  },
];

export const structureEntries: SeedEntry[] = structures.flatMap(({ beats, ...s }) => [
  { ...s, layer: "structure" },
  ...beats.map(
    (b): SeedEntry => ({
      slug: b.slug,
      name: b.name,
      aliases: b.aliases,
      layer: "beat",
      family: s.name,
      summary: b.summary,
      source: s.source,
      tvtropes: b.tvtropes,
    }),
  ),
]);

export const structureRelations: SeedRelation[] = structures.flatMap((s) =>
  s.beats.map((b, i) => ({
    from: b.slug,
    to: s.slug,
    kind: "stage_of",
    position: i + 1,
    start: b.span[0],
    end: b.span[1],
  })),
);
