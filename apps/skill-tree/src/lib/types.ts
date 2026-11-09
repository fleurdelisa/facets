/** "YYYY-MM" */
export type YearMonth = string;

export interface SelfInfo {
  name: string;
  title: string;
  /** One or two characters shown inside the center orb. */
  glyph: string;
  bio?: string;
}

export interface Branch {
  id: string;
  name: string;
  /** Base pigment (hex). Dark mode derives a neon variant from its hue. */
  color: string;
  glyph?: string;
}

export interface Skill {
  id: string;
  name: string;
  branchId: string;
  /** Another skill in the same branch this one grew out of. */
  parentId?: string | null;
  glyph?: string;
  started: YearMonth;
  lastActive: YearMonth | "present";
  /** Self rating, 1–5. */
  rating: number;
  note?: string;
  credentials?: string[];
}

export interface TreeData {
  version: 1;
  self: SelfInfo;
  branches: Branch[];
  skills: Skill[];
}
