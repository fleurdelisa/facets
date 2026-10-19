import type { SeedEntry } from "./schema";

const VONNEGUT = "Kurt Vonnegut, 'The Shapes of Stories' (lecture; rejected master's thesis)";
const REAGAN =
  "Reagan, Mitchell, Kiley, Danforth & Dodds, 'The emotional arcs of stories are dominated by six basic shapes' (2016)";
const REAGAN_URL = "https://arxiv.org/abs/1606.07772";

// Points are fortune over time in [-1, 1], sampled evenly from start to end.
// They're illustrative sketches of each shape, not data from the study.
export const arcs: SeedEntry[] = [
  {
    slug: "rags-to-riches-arc",
    name: "Rags to Riches (arc)",
    aliases: ["Rise"],
    family: "Reagan et al.",
    summary: "A steady rise in fortune from beginning to end.",
    source: REAGAN,
    sourceUrl: REAGAN_URL,
    arc: [-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8],
  },
  {
    slug: "riches-to-rags",
    name: "Riches to Rags",
    aliases: ["Fall", "Tragedy (arc)"],
    family: "Reagan et al.",
    summary: "A steady fall in fortune from beginning to end.",
    source: REAGAN,
    sourceUrl: REAGAN_URL,
    arc: [0.8, 0.6, 0.4, 0.2, 0, -0.2, -0.4, -0.6, -0.8],
  },
  {
    slug: "man-in-a-hole",
    name: "Man in a Hole",
    aliases: ["Fall–rise"],
    family: "Vonnegut · Reagan et al.",
    summary: "Somebody gets into trouble, then gets out of it — ending better off than they began.",
    description:
      "Vonnegut's favourite example: 'Somebody gets into trouble, gets out of it again. People love that story. They never get sick of it.' Reagan et al. found it as one of their six core shapes.",
    source: `${VONNEGUT}; ${REAGAN}`,
    sourceUrl: REAGAN_URL,
    arc: [0.3, 0.1, -0.3, -0.6, -0.7, -0.5, -0.1, 0.3, 0.5],
  },
  {
    slug: "icarus",
    name: "Icarus",
    aliases: ["Rise–fall"],
    family: "Reagan et al.",
    summary: "Fortune rises, peaks, and then collapses.",
    source: REAGAN,
    sourceUrl: REAGAN_URL,
    arc: [-0.3, 0, 0.4, 0.7, 0.8, 0.5, 0, -0.5, -0.8],
  },
  {
    slug: "cinderella",
    name: "Cinderella",
    aliases: ["Rise–fall–rise"],
    family: "Vonnegut · Reagan et al.",
    summary: "A rise, a sudden fall, and then a rise higher than before.",
    description:
      "Vonnegut drew Cinderella climbing step by step with each gift from the fairy godmother, dropping when the clock strikes midnight, then soaring off the top of the board when the slipper fits.",
    source: `${VONNEGUT}; ${REAGAN}`,
    sourceUrl: REAGAN_URL,
    arc: [-0.7, -0.3, 0.3, 0.6, 0.1, -0.5, -0.3, 0.4, 0.9],
  },
  {
    slug: "oedipus",
    name: "Oedipus",
    aliases: ["Fall–rise–fall"],
    family: "Reagan et al.",
    summary: "A fall, a recovery, and then a second, final fall.",
    source: REAGAN,
    sourceUrl: REAGAN_URL,
    arc: [0.6, 0.1, -0.5, -0.3, 0.2, 0.4, 0, -0.5, -0.9],
  },
  {
    slug: "boy-meets-girl",
    name: "Boy Meets Girl",
    family: "Vonnegut",
    summary: "An ordinary day, something wonderful found, lost, and found again.",
    source: VONNEGUT,
    arc: [0, 0.2, 0.6, 0.5, 0, -0.5, -0.3, 0.3, 0.7],
  },
  {
    slug: "from-bad-to-worse",
    name: "From Bad to Worse",
    family: "Vonnegut",
    summary: "Starts low and only sinks further, with no relief.",
    source: VONNEGUT,
    arc: [-0.4, -0.45, -0.5, -0.55, -0.6, -0.7, -0.75, -0.85, -0.95],
  },
  {
    slug: "which-way-is-up",
    name: "Which Way Is Up?",
    family: "Vonnegut",
    summary: "Events happen, but we can't tell whether they're good or bad news.",
    description:
      "Vonnegut's reading of Hamlet: the story's events refuse to sit clearly above or below the line, which he argued is part of why it feels so true.",
    source: VONNEGUT,
    arc: [0, 0.1, -0.1, 0.05, -0.05, 0.1, -0.1, 0.05, 0],
  },
  {
    slug: "creation-story",
    name: "Creation Story",
    family: "Vonnegut",
    summary: "Fortune rises in a series of steps as gift follows gift.",
    source: VONNEGUT,
    arc: [-0.2, -0.2, 0, 0, 0.2, 0.2, 0.4, 0.4, 0.6],
  },
  {
    slug: "old-testament",
    name: "Old Testament",
    family: "Vonnegut",
    summary: "A creation-story climb, then a sudden fall from grace.",
    source: VONNEGUT,
    arc: [0, 0.2, 0.4, 0.6, 0.8, 0.8, -0.8, -0.8, -0.8],
  },
  {
    slug: "new-testament",
    name: "New Testament",
    family: "Vonnegut",
    summary: "The Old Testament shape, followed by a rise beyond anything before.",
    source: VONNEGUT,
    arc: [0, 0.2, 0.4, 0.6, 0.8, -0.8, -0.8, 0.4, 1],
  },
].map((e) => ({ ...e, layer: "arc" }) as SeedEntry);
