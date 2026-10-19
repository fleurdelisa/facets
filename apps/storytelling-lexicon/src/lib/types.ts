// Mirrors the enums in supabase/migrations. Keep both in sync.

export const LAYERS = [
  "plot",
  "arc",
  "structure",
  "beat",
  "archetype",
  "trope",
  "device",
  "motif",
] as const;
export type Layer = (typeof LAYERS)[number];

export const LAYER_INFO: Record<Layer, { label: string; plural: string; blurb: string }> = {
  plot: {
    label: "Master plot",
    plural: "Master plots",
    blurb: "The overall shape of a whole story — Booker's seven, Polti's thirty-six.",
  },
  arc: {
    label: "Emotional arc",
    plural: "Emotional arcs",
    blurb: "Fortune over time, drawn as a line. Vonnegut's shapes and Reagan et al.'s six.",
  },
  structure: {
    label: "Structure",
    plural: "Structures",
    blurb: "Templates for the order of events: the hero's journey, beat sheets, kishōtenketsu.",
  },
  beat: {
    label: "Beat",
    plural: "Beats",
    blurb: "A single stage within a structure.",
  },
  archetype: {
    label: "Archetype",
    plural: "Archetypes",
    blurb: "Recurring character roles: the mentor, the trickster, the shadow.",
  },
  trope: {
    label: "Trope",
    plural: "Tropes",
    blurb: "Recurring situations and conventions: the underdog, the journey home.",
  },
  device: {
    label: "Device",
    plural: "Devices",
    blurb: "Techniques of telling: Chekhov's gun, the red herring, in medias res.",
  },
  motif: {
    label: "Motif",
    plural: "Motifs",
    blurb: "Small, concrete elements that recur: mirrors, labyrinths, forbidden fruit.",
  },
};

export const RELATION_KINDS = [
  "subtrope_of",
  "opposite_of",
  "related_to",
  "confused_with",
  "stage_of",
] as const;
export type RelationKind = (typeof RELATION_KINDS)[number];

export const MEDIA = ["show", "film", "book", "anime", "manga", "comic", "game", "play", "other"] as const;
export type Medium = (typeof MEDIA)[number];

export const WORK_STATUSES = ["planned", "in_progress", "finished", "dropped"] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

export const WORK_STATUS_LABEL: Record<WorkStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  finished: "Finished",
  dropped: "Dropped",
};

export type Entry = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  layer: Layer;
  family: string | null;
  summary: string;
  source_name: string | null;
  source_url: string | null;
  description: string | null;
  description_source: string | null;
  description_url: string | null;
  description_license: string | null;
  tvtropes: string | null;
  arc_points: number[] | null;
  owner_id: string | null;
};

export type EntryRelation = {
  from_id: string;
  to_id: string;
  kind: RelationKind;
  note: string | null;
  position: number | null;
  story_start: number | null;
  story_end: number | null;
};

export type Work = {
  id: string;
  title: string;
  medium: Medium;
  year: number | null;
  status: WorkStatus;
  notes: string | null;
  created_at: string;
};

export type Sighting = {
  id: string;
  work_id: string;
  entry_id: string;
  location: string | null;
  play: PlayType;
  note: string | null;
  spoiler: boolean;
  created_at: string;
};

export const PLAY_TYPES = [
  "straight",
  "exaggerated",
  "downplayed",
  "subverted",
  "double_subverted",
  "inverted",
  "averted",
  "lampshaded",
  "deconstructed",
  "reconstructed",
  "parodied",
  "zig_zagged",
] as const;
export type PlayType = (typeof PLAY_TYPES)[number];

// Definitions follow TV Tropes' "Playing With a Trope" vocabulary.
export const PLAY_INFO: Record<PlayType, { label: string; definition: string }> = {
  straight: { label: "Played straight", definition: "Used as-is, the way the audience expects." },
  exaggerated: { label: "Exaggerated", definition: "Pushed further than usual, often to absurdity." },
  downplayed: { label: "Downplayed", definition: "It happens, but to a lesser degree than usual." },
  subverted: {
    label: "Subverted",
    definition: "Set up so the audience expects it, then it doesn't happen.",
  },
  double_subverted: {
    label: "Double subverted",
    definition: "Seemingly subverted, then it happens after all.",
  },
  inverted: { label: "Inverted", definition: "The usual roles or elements are swapped." },
  averted: { label: "Averted", definition: "Simply absent, where you might have expected it." },
  lampshaded: {
    label: "Lampshaded",
    definition: "A character points it out — and it still happens.",
  },
  deconstructed: {
    label: "Deconstructed",
    definition: "Played out with realistic consequences that expose its assumptions.",
  },
  reconstructed: {
    label: "Reconstructed",
    definition: "Deconstructed, then rebuilt so it works again on new footing.",
  },
  parodied: { label: "Parodied", definition: "Mocked by imitating its conventions." },
  zig_zagged: {
    label: "Zig-zagged",
    definition: "Flips between several of the above within one work.",
  },
};

export const TVTROPES_LICENSE = "CC BY-NC-SA 3.0";
