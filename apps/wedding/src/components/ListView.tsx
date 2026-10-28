"use client";

import { useMemo, useState } from "react";
import { GuestTree, SECTION_ORDER, TreeNode, flattenSection, sectionTitle } from "@/lib/tree";
import { COUPLE_ID, Person, RSVP_LABEL, Rsvp } from "@/lib/types";
import { Avatar, RSVP_DOT, TIE_SHORT, TieGlyph, describeBirthday } from "./atoms";

type RsvpFilter = "all" | Rsvp;

export function ListView({
  tree,
  selectedId,
  onSelect,
  onUpdate,
}: {
  tree: GuestTree;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Person>) => void;
}) {
  const [query, setQuery] = useState("");
  const [rsvp, setRsvp] = useState<RsvpFilter>("all");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (p: Person) =>
      (rsvp === "all" || p.rsvp === rsvp) &&
      (!q || [p.name, p.label, p.notes, p.dietary, p.email].some((f) => f?.toLowerCase().includes(q)));
  }, [query, rsvp]);

  const couple = [tree.left, tree.right].filter(matches);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search names, notes, dietary needs…"
          className="w-full flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 text-xs">
          {(["all", "yes", "pending", "no"] as RsvpFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRsvp(r)}
              className={`rounded-md px-2.5 py-1 font-medium whitespace-nowrap ${rsvp === r ? "bg-foreground text-background" : "text-muted hover:bg-surface-2"}`}
            >
              {r === "all" ? "All" : RSVP_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {couple.length > 0 && (
        <Group title="The couple" count={2} attending={[tree.left, tree.right].filter((p) => p.rsvp === "yes").length}>
          {couple.map((p) => (
            <Row key={p.id} person={p} depth={0} tree={tree} selected={selectedId === p.id} onSelect={onSelect} onUpdate={onUpdate} />
          ))}
        </Group>
      )}

      {SECTION_ORDER.map((key) => {
        const section = tree.sections[key];
        const rows = flattenSection(section).filter((n) => matches(n.person));
        if (!rows.length) return null;
        return (
          <Group
            key={key}
            title={sectionTitle(key, tree.left, tree.right)}
            count={section.size}
            attending={section.attending}
            headcount={section.headcount}
          >
            {rows.map((n) => (
              <Row
                key={n.person.id}
                person={n.person}
                node={n}
                depth={n.depth}
                tree={tree}
                selected={selectedId === n.person.id}
                onSelect={onSelect}
                onUpdate={onUpdate}
              />
            ))}
          </Group>
        );
      })}
    </div>
  );
}

function Group({
  title,
  count,
  attending,
  headcount,
  children,
}: {
  title: string;
  count: number;
  attending: number;
  headcount?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border bg-surface-2/60 px-4 py-2.5">
        <h2 className="font-serif text-xl font-semibold">{title}</h2>
        <p className="text-xs text-muted">
          <span className="font-semibold text-foreground">{count}</span> {count === 1 ? "guest" : "guests"} ·{" "}
          {attending} attending
          {headcount !== undefined && headcount > count ? ` · ${headcount} with plus-ones` : ""}
        </p>
      </header>
      <ul className="divide-y divide-border">{children}</ul>
    </section>
  );
}

function Row({
  person,
  node,
  depth,
  tree,
  selected,
  onSelect,
  onUpdate,
}: {
  person: Person;
  node?: TreeNode;
  depth: number;
  tree: GuestTree;
  selected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Person>) => void;
}) {
  const parent = node && node.parentId !== COUPLE_ID ? tree.byId.get(node.parentId) : undefined;
  const birthday = person.birthday ? describeBirthday(person.birthday) : null;
  return (
    <li
      className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-surface-2/60 ${selected ? "bg-accent-soft/60" : ""}`}
      onClick={() => onSelect(person.id)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3" style={{ paddingLeft: Math.max(0, depth - 1) * 20 }}>
        {depth > 1 && <span className="h-5 w-3 shrink-0 border-b border-l border-border" style={{ marginTop: -14 }} aria-hidden />}
        <Avatar person={person} size={32} />
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-medium">
            {person.name}
            {person.plusOne && <span className="rounded-full bg-accent-soft px-1.5 text-[10px] font-semibold text-accent">+1</span>}
            {node && node.size > 1 && (
              <span className="rounded-full bg-surface-2 px-1.5 text-[10px] font-semibold text-muted" title="People in this branch">
                {node.size}
              </span>
            )}
          </p>
          <p className="truncate text-xs text-muted">
            {person.label}
            {parent && <> · via {parent.name}</>}
          </p>
        </div>
      </div>

      {node && (
        <span className="hidden w-24 shrink-0 items-center gap-1.5 text-xs text-muted md:inline-flex">
          <TieGlyph relation={person.relation} width={22} />
          {TIE_SHORT[person.relation]}
        </span>
      )}
      <span className="hidden w-28 shrink-0 text-xs text-muted lg:block" title={birthday?.detail}>
        {birthday?.date ?? "—"}
      </span>
      <span className="hidden w-40 shrink-0 truncate text-xs text-muted lg:block" title={person.notes}>
        {person.notes || person.dietary || ""}
      </span>
      <label className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="sr-only">RSVP for {person.name}</span>
        <span className="relative inline-flex items-center">
          <span className={`pointer-events-none absolute left-2 size-2 rounded-full ${RSVP_DOT[person.rsvp]}`} />
          <select
            value={person.rsvp}
            onChange={(e) => onUpdate(person.id, { rsvp: e.target.value as Rsvp })}
            className="appearance-none rounded-full border border-border bg-surface py-1 pr-3 pl-5 text-xs font-medium outline-none focus:border-accent"
          >
            {(["yes", "pending", "no"] as Rsvp[]).map((r) => (
              <option key={r} value={r}>
                {RSVP_LABEL[r]}
              </option>
            ))}
          </select>
        </span>
      </label>
    </li>
  );
}
