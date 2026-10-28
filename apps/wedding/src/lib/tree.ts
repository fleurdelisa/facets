import { COUPLE_ID, PARTNER_LEFT, PARTNER_RIGHT, Person, Relation, isPartner } from "./types";

export type SectionKey = "leftFamily" | "rightFamily" | "leftFriends" | "rightFriends" | "shared";

export interface TreeNode {
  person: Person;
  children: TreeNode[];
  /** People in this subtree, including this person. */
  size: number;
  /** Subtree headcount: people plus their plus-ones. */
  headcount: number;
  attending: number;
  /** 1 for people directly connected to the couple. */
  depth: number;
  section: SectionKey;
  parentId: string;
}

export interface Section {
  key: SectionKey;
  roots: TreeNode[];
  size: number;
  headcount: number;
  attending: number;
}

export interface GuestTree {
  byId: Map<string, Person>;
  nodes: Map<string, TreeNode>;
  sections: Record<SectionKey, Section>;
  left: Person;
  right: Person;
}

export const SECTION_ORDER: SectionKey[] = ["leftFamily", "rightFamily", "leftFriends", "rightFriends", "shared"];

export function sectionTitle(key: SectionKey, left: Person, right: Person): string {
  const possessive = (p: Person) => (p.name.trim().toLowerCase() === "you" ? "Your" : `${p.name}'s`);
  switch (key) {
    case "leftFamily":
      return `${possessive(left)} family`;
    case "rightFamily":
      return `${possessive(right)} family`;
    case "leftFriends":
      return `${possessive(left)} friends`;
    case "rightFriends":
      return `${possessive(right)} friends`;
    case "shared":
      return "Shared friends";
  }
}

/** Resolve `connectedTo`, falling back to the couple for missing parents and broken cycles. */
function resolveParents(people: Person[], byId: Map<string, Person>): Map<string, string> {
  const parent = new Map<string, string>();
  for (const p of people) {
    if (isPartner(p.id)) continue;
    const target = p.connectedTo;
    parent.set(p.id, target && (target === COUPLE_ID || (byId.has(target) && target !== p.id)) ? target : COUPLE_ID);
  }
  // Break cycles: walk up from every node; if we revisit, cut the link to the couple.
  for (const p of people) {
    if (isPartner(p.id)) continue;
    const seen = new Set<string>([p.id]);
    let cur = parent.get(p.id)!;
    while (cur !== COUPLE_ID && !isPartner(cur)) {
      if (seen.has(cur)) {
        parent.set(p.id, COUPLE_ID);
        break;
      }
      seen.add(cur);
      cur = parent.get(cur) ?? COUPLE_ID;
    }
  }
  return parent;
}

export function buildTree(people: Person[]): GuestTree {
  const byId = new Map(people.map((p) => [p.id, p]));
  const parent = resolveParents(people, byId);
  const childIds = new Map<string, string[]>();
  for (const p of people) {
    const par = parent.get(p.id);
    if (!par) continue;
    if (!childIds.has(par)) childIds.set(par, []);
    childIds.get(par)!.push(p.id);
  }

  const nodes = new Map<string, TreeNode>();
  const build = (id: string, depth: number, section: SectionKey, parentId: string): TreeNode => {
    const person = byId.get(id)!;
    const children = (childIds.get(id) ?? []).map((c) => build(c, depth + 1, section, id));
    const node: TreeNode = {
      person,
      children,
      depth,
      section,
      parentId,
      size: 1 + sum(children, (c) => c.size),
      headcount: 1 + (person.plusOne ? 1 : 0) + sum(children, (c) => c.headcount),
      attending:
        (person.rsvp === "yes" ? 1 + (person.plusOne ? 1 : 0) : 0) + sum(children, (c) => c.attending),
    };
    nodes.set(id, node);
    return node;
  };

  const rootsOf = (parentId: string, section: SectionKey, keep: (r: Relation) => boolean) =>
    (childIds.get(parentId) ?? [])
      .filter((id) => keep(byId.get(id)!.relation))
      .map((id) => build(id, 1, section, parentId));

  const family = (r: Relation) => r !== "friend";
  const friend = (r: Relation) => r === "friend";
  const makeSection = (key: SectionKey, roots: TreeNode[]): Section => ({
    key,
    roots,
    size: sum(roots, (r) => r.size),
    headcount: sum(roots, (r) => r.headcount),
    attending: sum(roots, (r) => r.attending),
  });

  const sections: Record<SectionKey, Section> = {
    leftFamily: makeSection("leftFamily", rootsOf(PARTNER_LEFT, "leftFamily", family)),
    rightFamily: makeSection("rightFamily", rootsOf(PARTNER_RIGHT, "rightFamily", family)),
    leftFriends: makeSection("leftFriends", rootsOf(PARTNER_LEFT, "leftFriends", friend)),
    rightFriends: makeSection("rightFriends", rootsOf(PARTNER_RIGHT, "rightFriends", friend)),
    // Anything hanging off the couple counts as a shared friend, whatever its relation says.
    shared: makeSection("shared", rootsOf(COUPLE_ID, "shared", () => true)),
  };

  return {
    byId,
    nodes,
    sections,
    left: byId.get(PARTNER_LEFT) ?? { id: PARTNER_LEFT, name: "You", connectedTo: null, relation: "inlaw", rsvp: "yes" },
    right: byId.get(PARTNER_RIGHT) ?? { id: PARTNER_RIGHT, name: "Partner", connectedTo: null, relation: "inlaw", rsvp: "yes" },
  };
}

function sum<T>(items: T[], f: (t: T) => number) {
  return items.reduce((acc, t) => acc + f(t), 0);
}

/** Every node of a section in depth-first order — the order the list view shows them in. */
export function flattenSection(section: Section): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (n: TreeNode) => {
    out.push(n);
    n.children.forEach(walk);
  };
  section.roots.forEach(walk);
  return out;
}

/** Ids of a person and everyone connected below them (used to prevent cycles when reconnecting). */
export function subtreeIds(tree: GuestTree, id: string): Set<string> {
  const ids = new Set<string>();
  const walk = (n: TreeNode) => {
    ids.add(n.person.id);
    n.children.forEach(walk);
  };
  const node = tree.nodes.get(id);
  if (node) walk(node);
  else ids.add(id);
  return ids;
}

export function totals(tree: GuestTree) {
  const people = [...tree.byId.values()];
  const count = (f: (p: Person) => boolean) => people.filter(f).length;
  return {
    people: people.length,
    headcount: people.length + count((p) => !!p.plusOne),
    yes: count((p) => p.rsvp === "yes"),
    pending: count((p) => p.rsvp === "pending"),
    no: count((p) => p.rsvp === "no"),
    attendingHeadcount: count((p) => p.rsvp === "yes") + count((p) => p.rsvp === "yes" && !!p.plusOne),
  };
}

/** "Mom · via Linda Tran" style description of where someone sits in the tree. */
export function connectionText(tree: GuestTree, person: Person): string {
  if (isPartner(person.id)) return "One half of the couple";
  const node = tree.nodes.get(person.id);
  const parentId = node?.parentId ?? person.connectedTo;
  if (!parentId || parentId === COUPLE_ID) return "Friend of the couple";
  const parent = tree.byId.get(parentId);
  if (parent && parent.name.trim().toLowerCase() === "you") {
    return person.relation === "blood" ? "Your family" : person.relation === "inlaw" ? "Your in-law" : "Your friend";
  }
  const verb = person.relation === "blood" ? "Family of" : person.relation === "inlaw" ? "Partner/in-law of" : "Friend of";
  return `${verb} ${parent?.name ?? "unknown"}`;
}
