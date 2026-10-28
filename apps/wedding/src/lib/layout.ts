import { GuestTree, Section, SectionKey, TreeNode } from "./tree";
import { COUPLE_ID, PARTNER_LEFT, PARTNER_RIGHT, Relation } from "./types";

export const COL = 172;
export const ROW = 118;
export const PARTNER_X = 150;
/** Gap between the center line and the inner edge of each side's block. */
const INNER_GAP = 36;

export interface Point {
  x: number;
  y: number;
}

export interface Edge {
  id: string;
  from: Point;
  to: Point;
  relation: Relation;
}

export interface SectionLabel {
  key: SectionKey;
  x: number;
  y: number;
}

export interface Layout {
  positions: Map<string, Point>;
  edges: Edge[];
  labels: SectionLabel[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

const leafWidth = (n: TreeNode): number =>
  Math.max(1, n.children.reduce((acc, c) => acc + leafWidth(c), 0));

const sectionWidth = (s: Section) => s.roots.reduce((acc, r) => acc + leafWidth(r), 0);

/**
 * Tidy-tree layout of one section. Starting at `innerX`, subtrees are laid side by side
 * moving outward in `hdir`; each generation steps one row in `vdir`.
 */
function layoutSection(
  section: Section,
  anchor: Point,
  innerX: number,
  hdir: 1 | -1,
  vdir: 1 | -1,
  positions: Map<string, Point>,
  edges: Edge[],
): number {
  let maxDepth = 0;
  const place = (node: TreeNode, start: number, parentPos: Point) => {
    const span = leafWidth(node) * COL;
    const pos = { x: start + (hdir * span) / 2, y: anchor.y + vdir * node.depth * ROW };
    positions.set(node.person.id, pos);
    edges.push({ id: `${node.parentId}->${node.person.id}`, from: parentPos, to: pos, relation: node.person.relation });
    maxDepth = Math.max(maxDepth, node.depth);
    let cursor = start;
    for (const child of node.children) {
      place(child, cursor, pos);
      cursor += hdir * leafWidth(child) * COL;
    }
  };

  let cursor = innerX;
  for (const root of section.roots) {
    place(root, cursor, anchor);
    cursor += hdir * leafWidth(root) * COL;
  }
  return maxDepth;
}

export function computeLayout(tree: GuestTree): Layout {
  const positions = new Map<string, Point>();
  const edges: Edge[] = [];
  const labels: SectionLabel[] = [];
  const { sections } = tree;

  const left = { x: -PARTNER_X, y: 0 };
  const right = { x: PARTNER_X, y: 0 };
  const center = { x: 0, y: 0 };
  positions.set(PARTNER_LEFT, left);
  positions.set(PARTNER_RIGHT, right);
  positions.set(COUPLE_ID, center);

  const sharedSpan = sectionWidth(sections.shared) * COL;
  const friendsInner = Math.max(INNER_GAP, sharedSpan / 2 + INNER_GAP / 2);

  const blocks: { key: SectionKey; anchor: Point; innerX: number; hdir: 1 | -1; vdir: 1 | -1 }[] = [
    { key: "leftFamily", anchor: left, innerX: -INNER_GAP, hdir: -1, vdir: -1 },
    { key: "rightFamily", anchor: right, innerX: INNER_GAP, hdir: 1, vdir: -1 },
    { key: "leftFriends", anchor: left, innerX: -friendsInner, hdir: -1, vdir: 1 },
    { key: "rightFriends", anchor: right, innerX: friendsInner, hdir: 1, vdir: 1 },
    { key: "shared", anchor: center, innerX: -sharedSpan / 2, hdir: 1, vdir: 1 },
  ];

  for (const b of blocks) {
    const section = sections[b.key];
    if (!section.roots.length) continue;
    const depth = layoutSection(section, b.anchor, b.innerX, b.hdir, b.vdir, positions, edges);
    const span = sectionWidth(section) * COL;
    labels.push({ key: b.key, x: b.innerX + (b.hdir * span) / 2, y: b.vdir * (depth * ROW + 64) });
  }

  let minX = left.x - 120;
  let maxX = right.x + 120;
  let minY = -80;
  let maxY = 80;
  for (const p of [...positions.values(), ...labels]) {
    minX = Math.min(minX, p.x - COL / 2);
    maxX = Math.max(maxX, p.x + COL / 2);
    minY = Math.min(minY, p.y - 40);
    maxY = Math.max(maxY, p.y + 40);
  }

  return { positions, edges, labels, bounds: { minX, maxX, minY, maxY } };
}

export function edgePath(from: Point, to: Point): string {
  const midY = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}
