import { archetypes } from "./archetypes";
import { arcs } from "./arcs";
import { devices } from "./devices";
import { motifs } from "./motifs";
import { plots } from "./plots";
import { relations } from "./relations";
import type { SeedEntry, SeedRelation } from "./schema";
import { structureEntries, structureRelations } from "./structures";
import { tropes } from "./tropes";

export type { SeedEntry, SeedRelation } from "./schema";

export const seedEntries: SeedEntry[] = [
  ...plots,
  ...arcs,
  ...structureEntries,
  ...archetypes,
  ...tropes,
  ...devices,
  ...motifs,
];

export const seedRelations: SeedRelation[] = [...structureRelations, ...relations];
