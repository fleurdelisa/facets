import type { GroupId } from "./groups";

export interface EtymonDef {
  id: string;
  group: GroupId;
  label: string;
  note?: string;
}

export interface WordData {
  word: string;
  story: string;
  etyma: EtymonDef[];
  /**
   * Language code → "native form|etymon id|romanization". Romanization may be
   * omitted for Latin script and for scripts handled by lib/translit.
   */
  forms: Record<string, string>;
}

export const E = (
  id: string,
  group: GroupId,
  label: string,
  note?: string,
): EtymonDef => ({ id, group, label, note });
