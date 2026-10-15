import type { Branch, Skill, TreeData, YearMonth } from "./types";

/* ------------------------------------------------------------------ time */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseYM(ym: YearMonth): { y: number; m: number } {
  const [y, m] = ym.split("-").map(Number);
  return { y: y || 2000, m: Math.min(12, Math.max(1, m || 1)) };
}

export function currentYM(now: Date): YearMonth {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthIndex(ym: YearMonth): number {
  const { y, m } = parseYM(ym);
  return y * 12 + (m - 1);
}

export function monthsSince(skill: Skill, now: Date): number {
  if (skill.lastActive === "present") return 0;
  return Math.max(0, monthIndex(currentYM(now)) - monthIndex(skill.lastActive));
}

/** Fully fresh for the first 6 months of inactivity, fully faded after 5 years. */
const FRESH_MONTHS = 6;
const FADED_MONTHS = 60;

export function freshness(skill: Skill, now: Date): number {
  const m = monthsSince(skill, now);
  if (m <= FRESH_MONTHS) return 1;
  return Math.max(0, 1 - (m - FRESH_MONTHS) / (FADED_MONTHS - FRESH_MONTHS));
}

export function formatYM(ym: YearMonth | "present"): string {
  if (ym === "present") return "Present";
  const { y, m } = parseYM(ym);
  return `${MONTHS[m - 1]} ${y}`;
}

export function formatPeriod(skill: Skill): string {
  return `${formatYM(skill.started)} – ${formatYM(skill.lastActive)}`;
}

function yearsLabel(months: number): string {
  if (months < 12) return months <= 1 ? "1 mo" : `${months} mos`;
  const y = Math.round(months / 12);
  return `${y} yr${y === 1 ? "" : "s"}`;
}

export function durationLabel(skill: Skill, now: Date): string {
  const end = skill.lastActive === "present" ? currentYM(now) : skill.lastActive;
  return yearsLabel(Math.max(1, monthIndex(end) - monthIndex(skill.started)));
}

export function statusLabel(skill: Skill, now: Date): string {
  if (skill.lastActive === "present") return "Active";
  const m = monthsSince(skill, now);
  if (m <= FRESH_MONTHS) return "Recently active";
  return `Dormant · ${yearsLabel(m)}`;
}

export const RATING_LABELS = ["Novice", "Apprentice", "Adept", "Expert", "Master"];

/* ----------------------------------------------------------------- color */

function hexToHsl(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue: number;
  if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  return [hue * 60, s, l];
}

const hsl = (h: number, s: number, l: number) =>
  `hsl(${h.toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%)`;

export interface ThemedColors {
  /** Light-mode fill, desaturated by staleness. */
  light: string;
  /** Dark-mode neon, desaturated by staleness. */
  dark: string;
  /** Full-strength variants (used for rating arcs). */
  lightFull: string;
  darkFull: string;
  /** Edge ink. */
  lightEdge: string;
  darkEdge: string;
}

export function themedColors(base: string, f: number): ThemedColors {
  const [h, s, l] = hexToHsl(base);
  const sat = 0.04 + 0.96 * f;
  const lightL = l + (0.66 - l) * (1 - f);
  const darkL = 0.6 + (0.44 - 0.6) * (1 - f);
  return {
    light: hsl(h, s * sat, lightL),
    dark: hsl(h, 0.95 * sat, darkL),
    lightFull: hsl(h, s, l),
    darkFull: hsl(h, 0.95, 0.6),
    lightEdge: hsl(h, s * sat * 0.8, Math.min(lightL, 0.3 + 0.32 * (1 - f))),
    darkEdge: hsl(h, 0.95 * sat, darkL),
  };
}

/* ---------------------------------------------------------------- layout */

export const SELF_R = 58;
export const BRANCH_R = 30;
export const SKILL_R = 24;

interface BaseNode {
  id: string;
  x: number;
  y: number;
  r: number;
  depth: number;
  freshness: number;
  colors: ThemedColors;
}
export interface SelfNode extends BaseNode {
  kind: "self";
}
export interface BranchNode extends BaseNode {
  kind: "branch";
  branch: Branch;
}
export interface SkillNode extends BaseNode {
  kind: "skill";
  branch: Branch;
  skill: Skill;
}
export type TreeNode = SelfNode | BranchNode | SkillNode;

export interface TreeEdge {
  id: string;
  from: TreeNode;
  to: TreeNode;
  freshness: number;
}

export interface Layout {
  nodes: TreeNode[];
  edges: TreeEdge[];
  rings: number[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

const branchKey = (id: string) => `b:${id}`;

/** Children of each branch / skill, keyed by `b:<branchId>` or skill id. */
export function childMap(data: TreeData): Map<string, Skill[]> {
  const byId = new Map(data.skills.map((s) => [s.id, s]));
  const kids = new Map<string, Skill[]>();
  for (const s of data.skills) {
    const parent = s.parentId ? byId.get(s.parentId) : undefined;
    const key = parent && parent.branchId === s.branchId ? parent.id : branchKey(s.branchId);
    if (!kids.has(key)) kids.set(key, []);
    kids.get(key)!.push(s);
  }
  for (const list of kids.values()) list.sort((a, b) => a.started.localeCompare(b.started));
  return kids;
}

/** All skill ids underneath `id` (exclusive). */
export function descendants(data: TreeData, id: string): Set<string> {
  const kids = childMap(data);
  const out = new Set<string>();
  const walk = (k: string) => {
    for (const c of kids.get(k) ?? []) {
      if (out.has(c.id)) continue;
      out.add(c.id);
      walk(c.id);
    }
  };
  walk(id);
  return out;
}

export function layoutTree(data: TreeData, now: Date): Layout {
  const kids = childMap(data);

  // Leaf counts decide how much of the circle each subtree gets.
  const leafMemo = new Map<string, number>();
  const leaves = (key: string, seen = new Set<string>()): number => {
    if (leafMemo.has(key)) return leafMemo.get(key)!;
    seen.add(key);
    const list = (kids.get(key) ?? []).filter((c) => !seen.has(c.id));
    const n = list.length === 0 ? 1 : list.reduce((sum, c) => sum + leaves(c.id, seen), 0);
    leafMemo.set(key, n);
    return n;
  };

  const total = data.branches.reduce((sum, b) => sum + leaves(branchKey(b.id)), 0) || 1;
  // Grow the rings when there are many leaves so neighbours keep ~95px apart.
  const scale = Math.max(1, (total * 95) / (2 * Math.PI * 275));
  const radiusAt = (depth: number) =>
    depth === 0 ? 0 : depth === 1 ? 155 * Math.max(1, scale * 0.85) : (275 + (depth - 2) * 115) * scale;

  const nodes: TreeNode[] = [];
  const edges: TreeEdge[] = [];

  const selfNode: SelfNode = {
    kind: "self",
    id: "self",
    x: 0,
    y: 0,
    r: SELF_R,
    depth: 0,
    freshness: 1,
    colors: themedColors("#7a5a2e", 1),
  };
  nodes.push(selfNode);

  const polar = (angle: number, depth: number) => ({
    x: Math.cos(angle) * radiusAt(depth),
    y: Math.sin(angle) * radiusAt(depth),
  });

  let maxDepth = 1;
  const placed = new Set<string>();

  /** Places the children of `key` in [a0, a1) and returns their max freshness. */
  const placeChildren = (key: string, parent: TreeNode, branch: Branch, a0: number, a1: number, depth: number): number => {
    const list = (kids.get(key) ?? []).filter((c) => !placed.has(c.id));
    const span = a1 - a0;
    const sum = list.reduce((s, c) => s + leaves(c.id), 0) || 1;
    let a = a0;
    let best = 0;
    for (const skill of list) {
      placed.add(skill.id);
      const share = (span * leaves(skill.id)) / sum;
      const mid = a + share / 2;
      const f = freshness(skill, now);
      const node: SkillNode = {
        kind: "skill",
        id: skill.id,
        ...polar(mid, depth),
        r: SKILL_R,
        depth,
        freshness: f,
        colors: themedColors(branch.color, f),
        branch,
        skill,
      };
      nodes.push(node);
      edges.push({ id: `${parent.id}->${skill.id}`, from: parent, to: node, freshness: f });
      maxDepth = Math.max(maxDepth, depth);
      best = Math.max(best, f, placeChildren(skill.id, node, branch, a, a + share, depth + 1));
      a += share;
    }
    return best;
  };

  const firstShare = data.branches.length ? (2 * Math.PI * leaves(branchKey(data.branches[0].id))) / total : 0;
  let a = -Math.PI / 2 - firstShare / 2;
  for (const branch of data.branches) {
    const share = (2 * Math.PI * leaves(branchKey(branch.id))) / total;
    const mid = a + share / 2;
    const node: BranchNode = {
      kind: "branch",
      id: branchKey(branch.id),
      ...polar(mid, 1),
      r: BRANCH_R,
      depth: 1,
      freshness: 0,
      colors: themedColors(branch.color, 0),
      branch,
    };
    nodes.push(node);
    const edge: TreeEdge = { id: `self->${node.id}`, from: selfNode, to: node, freshness: 0 };
    edges.push(edge);
    const f = placeChildren(branchKey(branch.id), node, branch, a, a + share, 2);
    node.freshness = f;
    node.colors = themedColors(branch.color, f);
    edge.freshness = f;
    a += share;
  }

  const bounds = nodes.reduce(
    (b, n) => ({
      minX: Math.min(b.minX, n.x - n.r - 70),
      minY: Math.min(b.minY, n.y - n.r - 40),
      maxX: Math.max(b.maxX, n.x + n.r + 70),
      maxY: Math.max(b.maxY, n.y + n.r + 44),
    }),
    { minX: -SELF_R, minY: -SELF_R, maxX: SELF_R, maxY: SELF_R },
  );

  const rings = Array.from({ length: maxDepth }, (_, i) => radiusAt(i + 1));
  return { nodes, edges, rings, bounds };
}

/* -------------------------------------------------------------- geometry */

/** SVG path for rating segment `i` (0–4) arcing over the top of a circle of radius `r`. */
export function ratingArcPath(r: number, i: number): string {
  const START = 158;
  const SPAN = 136;
  const GAP = 6;
  const seg = (SPAN - GAP * 4) / 5;
  const a0 = ((START - i * (seg + GAP)) * Math.PI) / 180;
  const a1 = a0 - (seg * Math.PI) / 180;
  const p = (a: number) => `${(Math.cos(a) * r).toFixed(2)} ${(-Math.sin(a) * r).toFixed(2)}`;
  return `M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`;
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .slice(0, 40) || "skill"
  );
}

export function defaultGlyph(name: string): string {
  const words = name.replace(/[()]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
