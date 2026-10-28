"use client";

import { useEffect } from "react";
import { GuestTree } from "@/lib/tree";
import { Person, Relation, isGroup, isPartner } from "@/lib/types";
import { TIE_SHORT, TieGlyph } from "./atoms";
import { PersonDetails, PersonForm, RsvpPicker } from "./PersonCard";

export type PanelState =
  | { mode: "view"; id: string }
  | { mode: "edit"; id: string }
  | { mode: "new"; draft: Person };

export function GuestPanel({
  state,
  tree,
  onChange,
  onClose,
  onSave,
  onDelete,
  onUpdate,
  onAddConnection,
}: {
  state: PanelState;
  tree: GuestTree;
  onChange: (s: PanelState) => void;
  onClose: () => void;
  onSave: (p: Person, isNew: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Person>) => void;
  onAddConnection: (to: Person, relation: Relation) => void;
}) {
  const person = state.mode === "new" ? state.draft : tree.byId.get(state.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.mode === "view") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.mode, onClose]);

  if (!person) return null;

  return (
    <aside
      className="animate-card-in fixed inset-x-0 bottom-0 z-30 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 shadow-2xl sm:inset-x-auto sm:top-20 sm:right-4 sm:bottom-4 sm:w-[380px] sm:rounded-2xl"
      aria-label="Guest details"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          {isGroup(person)
            ? state.mode === "new"
              ? "New group"
              : state.mode === "edit"
                ? "Edit group"
                : "Group"
            : state.mode === "new"
              ? "New guest"
              : state.mode === "edit"
                ? "Edit guest"
                : "Guest card"}
        </p>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-foreground"
          aria-label="Close"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {state.mode === "view" ? (
        <div className="flex flex-col gap-5">
          <PersonDetails person={person} tree={tree} />

          {!isGroup(person) && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted">
                Quick RSVP
              </p>
              <RsvpPicker
                value={person.rsvp}
                onChange={(rsvp) => onUpdate(person.id, { rsvp })}
              />
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">
              {isGroup(person)
                ? `Add someone to ${person.name}`
                : `Add someone connected to ${person.name.split(" ")[0]}`}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {(["blood", "inlaw", "friend"] as Relation[]).map((r) => (
                <button
                  key={r}
                  onClick={() => onAddConnection(person, r)}
                  className="flex flex-col items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs hover:bg-surface-2"
                >
                  <TieGlyph relation={r} width={36} />+ {TIE_SHORT[r]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 border-t border-border pt-4">
            <button
              onClick={() => onChange({ mode: "edit", id: person.id })}
              className="flex-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90 dark:text-black"
            >
              Edit details
            </button>
            {!isPartner(person.id) && (
              <button
                onClick={() => {
                  const kids = tree.nodes.get(person.id)?.children.length ?? 0;
                  const extra = kids
                    ? `\n\nThe ${kids} ${kids === 1 ? "person" : "people"} connected through them will move up a level.`
                    : "";
                  const what = isGroup(person)
                    ? `the group "${person.name}"`
                    : `${person.name} from the guest list`;
                  if (window.confirm(`Remove ${what}?${extra}`))
                    onDelete(person.id);
                }}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:border-accent hover:text-accent"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <PersonForm
          key={state.mode === "new" ? state.draft.id : state.id}
          initial={person}
          tree={tree}
          isNew={state.mode === "new"}
          onSave={(p) => onSave(p, state.mode === "new")}
          onCancel={() =>
            state.mode === "new"
              ? onClose()
              : onChange({ mode: "view", id: person.id })
          }
        />
      )}
    </aside>
  );
}
