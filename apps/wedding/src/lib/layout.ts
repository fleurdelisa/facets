import { GuestTree, Section, SectionKey, TreeNode } from "./tree";
import { COUPLE_ID, PARTNER_LEFT, PARTNER_RIGHT, Relation } from "./types";

export const COL = 172;
export const ROW = 118;
export const PARTNER_X = 150;
/** Gap between the center line and the inner edge of each side's block. */
const INNER_GAP = 36;
/** Above this many children, a node's children wrap into rows instead of one long line. */
const WRAP_AFTER = 8;
/** Even with few children, wrap once a single row would be wider than this many columns. */
const MAX_ROW_COLS = 18;

export interface Point {
  x: number;
  y: number;
}

export interface Edge {
  /** `${parentId}->${childId}` */
  id: string;
  childId: string;
  from: Point;
  to: Point;
  relation: Relation;
}

/** Shared trunk/rail lines that feed a wrapped block of children. */
export interface Bus {
  parentId: string;
  d: string;
}

export interface SectionLabel {
  key: SectionKey;
  x: number;
  y: number;
}

export interface Layout {
  positions: Map<string, Point>;
  edges: Edge[];
  buses: Bus[];
  labels: SectionLabel[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

/** Size of a subtree in grid units: w columns wide, h rows tall (including the node itself). */
interface Box {
  w: number;
  h: number;
  /** Children split into wrapped rows, or null when they sit in a single row. */
  rows: TreeNode[][] | null;
}

/** How a list of children is arranged under its parent: one row, or wrapped rows. */
interface Region {
  w: number;
  h: number;
  rows: TreeNode[][] | null;
}

function measureChildren(
  children: TreeNode[],
  boxes: Map<TreeNode, Box>,
  collapsed: Set<string>,
): Region {
  const kids = children.map((c) => ({
    node: c,
    box: measure(c, boxes, collapsed),
  }));
  const rowWidth = kids.reduce((a, k) => a + k.box.w, 0);
  if (
    kids.length <= 1 ||
    (kids.length <= WRAP_AFTER && rowWidth <= MAX_ROW_COLS)
  ) {
    return {
      w: kids.reduce((a, k) => a + k.box.w, 0),
      h: Math.max(0, ...kids.map((k) => k.box.h)),
      rows: null,
    };
  }
  // Pack by area so the block comes out roughly 2.5:1, which suits a landscape screen.
  const area = kids.reduce((a, k) => a + k.box.w * k.box.h, 0);
  const limit = Math.max(WRAP_AFTER, Math.ceil(Math.sqrt(area * 2.5)));
  const rows: { items: typeof kids; w: number }[] = [];
  for (const k of kids) {
    const last = rows[rows.length - 1];
    if (last && last.w + k.box.w <= limit) {
      last.items.push(k);
      last.w += k.box.w;
    } else rows.push({ items: [k], w: k.box.w });
  }
  return {
    w: Math.max(...rows.map((r) => r.w)),
    h: rows.reduce((a, r) => a + Math.max(...r.items.map((k) => k.box.h)), 0),
    rows: rows.map((r) => r.items.map((k) => k.node)),
  };
}

export const visibleChildren = (node: TreeNode, collapsed: Set<string>) =>
  collapsed.has(node.person.id) ? [] : node.children;

function measure(
  node: TreeNode,
  boxes: Map<TreeNode, Box>,
  collapsed: Set<string>,
): Box {
  const region = measureChildren(
    visibleChildren(node, collapsed),
    boxes,
    collapsed,
  );
  const box = { w: Math.max(1, region.w), h: 1 + region.h, rows: region.rows };
  boxes.set(node, box);
  return box;
}

/**
 * Tidy-tree layout of one section. Starting at `innerX`, subtrees are laid side by side
 * moving outward in `hdir`; each row steps ROW in `vdir`. Returns how many rows it used.
 */
function layoutSection(
  section: Section,
  anchor: Point,
  innerX: number,
  hdir: 1 | -1,
  vdir: 1 | -1,
  out: Pick<Layout, "positions" | "edges" | "buses">,
  collapsed: Set<string>,
): number {
  const boxes = new Map<TreeNode, Box>();
  const region = measureChildren(section.roots, boxes, collapsed);
  let maxRow = 0;
  const yOf = (row: number) => anchor.y + vdir * row * ROW;

  const place = (
    node: TreeNode,
    start: number,
    row: number,
    parentPos: Point,
    viaRail: boolean,
  ) => {
    const box = boxes.get(node)!;
    const pos = { x: start + (hdir * box.w * COL) / 2, y: yOf(row) };
    out.positions.set(node.person.id, pos);
    // Children of a wrapped block hang off a rail just above them with a short tie-styled stub.
    const from = viaRail
      ? { x: pos.x, y: pos.y - (vdir * ROW) / 2 }
      : parentPos;
    out.edges.push({
      id: `${node.parentId}->${node.person.id}`,
      childId: node.person.id,
      from,
      to: pos,
      relation: node.person.relation,
    });
    maxRow = Math.max(maxRow, row);
    placeChildren(
      visibleChildren(node, collapsed),
      box.rows,
      node.person.id,
      pos,
      start,
      row + 1,
    );
  };

  const placeChildren = (
    children: TreeNode[],
    rows: TreeNode[][] | null,
    parentId: string,
    parentPos: Point,
    start: number,
    row: number,
  ) => {
    if (!rows) {
      let cursor = start;
      for (const child of children) {
        place(child, cursor, row, parentPos, false);
        cursor += hdir * boxes.get(child)!.w * COL;
      }
      return;
    }

    // Wrapped: a trunk runs along the block's inner edge, with a rail above each row.
    const rails: number[] = [];
    let d = "";
    for (const items of rows) {
      const railY = yOf(row) - (vdir * ROW) / 2;
      rails.push(railY);
      let cursor = start;
      let farX = start;
      for (const child of items) {
        place(child, cursor, row, parentPos, true);
        farX = out.positions.get(child.person.id)!.x;
        cursor += hdir * boxes.get(child)!.w * COL;
      }
      const end =
        hdir > 0 ? Math.max(farX, parentPos.x) : Math.min(farX, parentPos.x);
      d += `M ${start} ${railY} H ${end} `;
      row += Math.max(...items.map((c) => boxes.get(c)!.h));
    }
    d += `M ${parentPos.x} ${parentPos.y} V ${rails[0]} M ${start} ${rails[0]} V ${rails[rails.length - 1]}`;
    out.buses.push({ parentId, d });
  };

  placeChildren(
    section.roots,
    region.rows,
    section.roots[0]?.parentId ?? "",
    anchor,
    innerX,
    1,
  );
  return maxRow;
}

const sectionWidth = (s: Section, collapsed: Set<string>) =>
  measureChildren(s.roots, new Map(), collapsed).w;

/** `collapsed` holds ids whose branches are folded away. */
export function computeLayout(
  tree: GuestTree,
  collapsed: Set<string> = new Set(),
): Layout {
  const out: Pick<Layout, "positions" | "edges" | "buses"> = {
    positions: new Map(),
    edges: [],
    buses: [],
  };
  const labels: SectionLabel[] = [];
  const { sections } = tree;

  const left = { x: -PARTNER_X, y: 0 };
  const right = { x: PARTNER_X, y: 0 };
  const center = { x: 0, y: 0 };
  out.positions.set(PARTNER_LEFT, left);
  out.positions.set(PARTNER_RIGHT, right);
  out.positions.set(COUPLE_ID, center);

  const sharedSpan = sectionWidth(sections.shared, collapsed) * COL;
  const friendsInner = Math.max(INNER_GAP, sharedSpan / 2 + INNER_GAP / 2);

  const blocks: {
    key: SectionKey;
    anchor: Point;
    innerX: number;
    hdir: 1 | -1;
    vdir: 1 | -1;
  }[] = [
    { key: "leftFamily", anchor: left, innerX: -INNER_GAP, hdir: -1, vdir: -1 },
    { key: "rightFamily", anchor: right, innerX: INNER_GAP, hdir: 1, vdir: -1 },
    {
      key: "leftFriends",
      anchor: left,
      innerX: -friendsInner,
      hdir: -1,
      vdir: 1,
    },
    {
      key: "rightFriends",
      anchor: right,
      innerX: friendsInner,
      hdir: 1,
      vdir: 1,
    },
    {
      key: "shared",
      anchor: center,
      innerX: -sharedSpan / 2,
      hdir: 1,
      vdir: 1,
    },
  ];

  for (const b of blocks) {
    const section = sections[b.key];
    if (!section.roots.length) continue;
    const rows = layoutSection(
      section,
      b.anchor,
      b.innerX,
      b.hdir,
      b.vdir,
      out,
      collapsed,
    );
    const span = sectionWidth(section, collapsed) * COL;
    labels.push({
      key: b.key,
      x: b.innerX + (b.hdir * span) / 2,
      y: b.vdir * (rows * ROW + 64),
    });
  }

  let minX = left.x - 120;
  let maxX = right.x + 120;
  let minY = -80;
  let maxY = 80;
  for (const p of [...out.positions.values(), ...labels]) {
    minX = Math.min(minX, p.x - COL / 2);
    maxX = Math.max(maxX, p.x + COL / 2);
    minY = Math.min(minY, p.y - 40);
    maxY = Math.max(maxY, p.y + 40);
  }

  return { ...out, labels, bounds: { minX, maxX, minY, maxY } };
}

export function edgePath(from: Point, to: Point): string {
  const midY = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}
