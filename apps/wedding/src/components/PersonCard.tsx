"use client";

import { useMemo, useState } from "react";
import { GuestTree, TreeNode, connectionText, subtreeIds } from "@/lib/tree";
import {
  COUPLE_ID,
  Person,
  RELATION_LABEL,
  RSVP_LABEL,
  Relation,
  Rsvp,
  isGroup,
  isPartner,
} from "@/lib/types";
import {
  Avatar,
  RsvpBadge,
  TIE_SHORT,
  TieGlyph,
  describeBirthday,
} from "./atoms";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-2 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

/** The read-only card body, shared by the hover preview and the pinned panel. */
export function PersonDetails({
  person,
  tree,
}: {
  person: Person;
  tree: GuestTree;
}) {
  const node = tree.nodes.get(person.id);
  if (isGroup(person))
    return <GroupDetails person={person} node={node} tree={tree} />;
  const birthday = person.birthday ? describeBirthday(person.birthday) : null;
  const partner = isPartner(person.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Avatar person={person} size={48} />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-2xl leading-tight font-semibold">
            {person.name || "Unnamed guest"}
          </h3>
          {person.label && <p className="text-sm text-muted">{person.label}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RsvpBadge rsvp={person.rsvp} />
            {person.plusOne && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                +1
              </span>
            )}
            {person.unlikely && (
              <span className="rounded-full border border-dashed border-muted/60 px-2 py-0.5 text-xs font-medium text-muted">
                Unlikely to come
              </span>
            )}
          </div>
        </div>
      </div>

      <dl className="flex flex-col gap-2">
        <Field label="Connection">
          <span className="inline-flex items-center gap-2">
            {!partner && <TieGlyph relation={person.relation} />}
            {connectionText(tree, person)}
          </span>
        </Field>
        {node && node.size > 1 && <SubtreeField node={node} />}
        {birthday && (
          <Field label="Birthday">
            {birthday.date}{" "}
            <span className="text-muted">· {birthday.detail}</span>
          </Field>
        )}
        {person.dietary && <Field label="Dietary">{person.dietary}</Field>}
        {person.email && (
          <Field label="Email">
            <a
              className="underline decoration-border underline-offset-2 hover:decoration-accent"
              href={`mailto:${person.email}`}
            >
              {person.email}
            </a>
          </Field>
        )}
        {person.phone && (
          <Field label="Phone">
            <a
              className="underline decoration-border underline-offset-2 hover:decoration-accent"
              href={`tel:${person.phone}`}
            >
              {person.phone}
            </a>
          </Field>
        )}
      </dl>

      {person.notes && (
        <div className="rounded-lg bg-surface-2 p-3 text-sm leading-relaxed whitespace-pre-wrap">
          <p className="mb-1 text-xs font-medium tracking-wide text-muted uppercase">
            Notes
          </p>
          {person.notes}
        </div>
      )}
    </div>
  );
}

function GroupDetails({
  person,
  node,
  tree,
}: {
  person: Person;
  node?: TreeNode;
  tree: GuestTree;
}) {
  const size = node?.size ?? 0;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-serif text-2xl leading-tight font-semibold">
          {person.name}
        </h3>
        {person.label && <p className="text-sm text-muted">{person.label}</p>}
      </div>
      <dl className="flex flex-col gap-2">
        <Field label="Connection">
          <span className="inline-flex items-center gap-2">
            <TieGlyph relation={person.relation} />
            {connectionText(tree, person)}
          </span>
        </Field>
        <Field label="Guests">
          {size}
          {node && node.headcount > size && (
            <span className="text-muted">
              {" "}
              · {node.headcount} with plus-ones
            </span>
          )}
        </Field>
        {node && (
          <Field label="Status">
            {node.attending} attending
            <span className="text-muted">
              {node.unlikely ? ` · ${node.unlikely} unlikely` : ""}
            </span>
          </Field>
        )}
      </dl>
      {person.notes && (
        <div className="rounded-lg bg-surface-2 p-3 text-sm leading-relaxed whitespace-pre-wrap">
          <p className="mb-1 text-xs font-medium tracking-wide text-muted uppercase">
            Notes
          </p>
          {person.notes}
        </div>
      )}
    </div>
  );
}

function SubtreeField({ node }: { node: TreeNode }) {
  const others = node.size - 1;
  return (
    <Field label="Brings">
      {others} connected {others === 1 ? "guest" : "guests"}
      <span className="text-muted">
        {" "}
        · {node.size} in group, {node.attending} attending
      </span>
    </Field>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export function PersonForm({
  initial,
  tree,
  isNew,
  onSave,
  onCancel,
}: {
  initial: Person;
  tree: GuestTree;
  isNew: boolean;
  onSave: (p: Person) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Person>(initial);
  const set = <K extends keyof Person>(key: K, value: Person[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const partner = isPartner(initial.id);
  const group = isGroup(initial);

  // Anyone except this person and the people hanging off them can be the connection.
  const options = useMemo(() => {
    const excluded = isNew ? new Set<string>() : subtreeIds(tree, initial.id);
    return [...tree.byId.values()]
      .filter((p) => !excluded.has(p.id))
      .sort(
        (a, b) =>
          Number(isPartner(b.id)) - Number(isPartner(a.id)) ||
          a.name.localeCompare(b.name),
      );
  }, [tree, initial.id, isNew]);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...draft, name: draft.name.trim() || "Unnamed guest" });
      }}
    >
      <FormRow label={group ? "Group name" : "Name"}>
        <input
          className={inputClass}
          value={draft.name}
          autoFocus
          onChange={(e) => set("name", e.target.value)}
        />
      </FormRow>
      <FormRow
        label={
          group
            ? "Description (optional)"
            : "Relationship (e.g. Mom, college roommate)"
        }
      >
        <input
          className={inputClass}
          value={draft.label ?? ""}
          onChange={(e) => set("label", e.target.value)}
        />
      </FormRow>

      {!partner && (
        <>
          <FormRow label="Connected to">
            <select
              className={inputClass}
              value={draft.connectedTo ?? COUPLE_ID}
              onChange={(e) => {
                const connectedTo = e.target.value;
                // Shared friends always hang off the couple with a friend line.
                setDraft((d) => ({
                  ...d,
                  connectedTo,
                  relation: connectedTo === COUPLE_ID ? "friend" : d.relation,
                }));
              }}
            >
              <option value={COUPLE_ID}>Both of us (shared friend)</option>
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.label ? ` — ${p.label}` : ""}
                </option>
              ))}
            </select>
          </FormRow>
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-xs font-medium text-muted">Tie</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {(["blood", "inlaw", "friend"] as Relation[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={draft.connectedTo === COUPLE_ID && r !== "friend"}
                  onClick={() => set("relation", r)}
                  title={RELATION_LABEL[r]}
                  className={`flex flex-col items-center gap-1 rounded-md border px-2 py-1.5 text-xs transition disabled:opacity-40 ${
                    draft.relation === r
                      ? "border-accent bg-accent-soft"
                      : "border-border hover:bg-surface-2"
                  }`}
                >
                  <TieGlyph relation={r} width={36} />
                  {TIE_SHORT[r]}
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {group ? (
        <FormRow label="Notes">
          <textarea
            rows={3}
            className={inputClass}
            value={draft.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
          />
        </FormRow>
      ) : (
        <>
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-xs font-medium text-muted">
              RSVP
            </legend>
            <RsvpPicker value={draft.rsvp} onChange={(r) => set("rsvp", r)} />
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!draft.plusOne}
              onChange={(e) => set("plusOne", e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Bringing a plus-one
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!draft.unlikely}
              onChange={(e) => set("unlikely", e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Unlikely to come
          </label>

          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Birthday">
              <input
                type="date"
                className={inputClass}
                value={draft.birthday ?? ""}
                onChange={(e) => set("birthday", e.target.value || undefined)}
              />
            </FormRow>
            <FormRow label="Dietary needs">
              <input
                className={inputClass}
                value={draft.dietary ?? ""}
                onChange={(e) => set("dietary", e.target.value)}
              />
            </FormRow>
            <FormRow label="Email">
              <input
                type="email"
                className={inputClass}
                value={draft.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
              />
            </FormRow>
            <FormRow label="Phone">
              <input
                type="tel"
                className={inputClass}
                value={draft.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
              />
            </FormRow>
          </div>
          <FormRow label="Acquaintance notes">
            <textarea
              rows={4}
              className={inputClass}
              placeholder="How you know them, stories, seating considerations…"
              value={draft.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </FormRow>
        </>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm hover:bg-surface-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 dark:text-black"
        >
          {isNew ? (group ? "Add group" : "Add guest") : "Save"}
        </button>
      </div>
    </form>
  );
}

export function RsvpPicker({
  value,
  onChange,
}: {
  value: Rsvp;
  onChange: (r: Rsvp) => void;
}) {
  const active: Record<Rsvp, string> = {
    yes: "bg-rsvp-yes-soft text-rsvp-yes border-rsvp-yes",
    pending: "bg-rsvp-pending-soft text-rsvp-pending border-rsvp-pending",
    no: "bg-rsvp-no-soft text-rsvp-no border-rsvp-no",
  };
  return (
    <div className="grid grid-cols-3 gap-1.5" role="radiogroup">
      {(["yes", "pending", "no"] as Rsvp[]).map((r) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={value === r}
          onClick={() => onChange(r)}
          className={`rounded-md border px-2 py-1.5 text-xs font-medium transition ${
            value === r
              ? active[r]
              : "border-border text-muted hover:bg-surface-2"
          }`}
        >
          {RSVP_LABEL[r]}
        </button>
      ))}
    </div>
  );
}
