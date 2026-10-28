"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { GuestPanel, PanelState } from "@/components/GuestPanel";
import { ListView } from "@/components/ListView";
import { TreeView } from "@/components/TreeView";
import { newId, parseGuestData, useGuestStore } from "@/lib/store";
import { buildTree, totals } from "@/lib/tree";
import { PARTNER_LEFT, Person, Relation } from "@/lib/types";

type ViewMode = "tree" | "list";

export default function Home() {
  const { data, loaded, updatePerson, addPerson, removePerson, replaceAll, reset } = useGuestStore();
  const tree = useMemo(() => buildTree(data.people), [data.people]);
  const sum = totals(tree);
  const [view, setView] = useState<ViewMode>("tree");
  const [panel, setPanel] = useState<PanelState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedId = panel && panel.mode !== "new" ? panel.id : null;
  const close = useCallback(() => setPanel(null), []);

  const startNew = (connectedTo: string, relation: Relation) =>
    setPanel({ mode: "new", draft: { id: newId(), name: "", connectedTo, relation, rsvp: "pending" } });

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wedding-guests.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File) => {
    const parsed = parseGuestData(await file.text());
    if (!parsed) {
      window.alert("That file doesn't look like a guest list export.");
      return;
    }
    replaceAll(parsed);
    setPanel(null);
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="z-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border bg-surface/90 px-4 py-2.5 sm:gap-y-3 backdrop-blur sm:px-6">
        <div>
          <h1 className="font-serif text-2xl leading-none font-semibold sm:text-3xl">Guest Tree</h1>
          <p className="mt-1 hidden text-xs text-muted sm:block">Family on top, friends below, the two of you in the middle.</p>
        </div>

        <dl className="order-last flex w-full flex-wrap items-center gap-1.5 text-xs sm:gap-2 lg:order-none lg:w-auto">
          <Stat label="Total guests" value={sum.people} hint={sum.headcount > sum.people ? `${sum.headcount} with plus-ones` : undefined} strong />
          <Stat label="Attending" value={sum.yes} tone="bg-rsvp-yes" hint={sum.attendingHeadcount > sum.yes ? `${sum.attendingHeadcount} heads` : undefined} />
          <Stat label="Waiting" value={sum.pending} tone="bg-rsvp-pending" />
          <Stat label="Declined" value={sum.no} tone="bg-rsvp-no" />
        </dl>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-surface p-0.5 text-sm" role="tablist">
            {(["tree", "list"] as ViewMode[]).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1 font-medium capitalize ${view === v ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => startNew(PARTNER_LEFT, "blood")}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 dark:text-black"
          >
            + Add guest
          </button>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg border border-border px-2.5 py-1.5 text-sm text-muted hover:text-foreground" aria-label="More">
              •••
            </summary>
            <div className="absolute right-0 z-40 mt-1 flex w-48 flex-col rounded-lg border border-border bg-surface p-1 text-sm shadow-lg">
              <MenuItem onClick={exportJson}>Export JSON</MenuItem>
              <MenuItem onClick={() => fileRef.current?.click()}>Import JSON…</MenuItem>
              <MenuItem
                onClick={() => {
                  if (window.confirm("Replace your guest list with the sample data?")) {
                    reset();
                    setPanel(null);
                  }
                }}
              >
                Reset to sample data
              </MenuItem>
            </div>
          </details>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      <main className={`relative min-h-0 flex-1 ${view === "list" ? "overflow-y-auto" : ""}`}>
        {!loaded ? null : view === "tree" ? (
          <TreeView tree={tree} selectedId={selectedId} onSelect={(id) => setPanel({ mode: "view", id })} />
        ) : (
          <ListView tree={tree} selectedId={selectedId} onSelect={(id) => setPanel({ mode: "view", id })} onUpdate={updatePerson} />
        )}
      </main>

      {panel && (
        <GuestPanel
          state={panel}
          tree={tree}
          onChange={setPanel}
          onClose={close}
          onUpdate={updatePerson}
          onDelete={(id) => {
            removePerson(id);
            setPanel(null);
          }}
          onSave={(p: Person, isNew) => {
            if (isNew) addPerson(p);
            else updatePerson(p.id, p);
            setPanel({ mode: "view", id: p.id });
          }}
          onAddConnection={(to, relation) => startNew(to.id, relation)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone, hint, strong }: { label: string; value: number; tone?: string; hint?: string; strong?: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 ${strong ? "bg-foreground text-background" : "bg-surface"}`}>
      {tone && <span className={`size-2 rounded-full ${tone}`} />}
      <dt className={strong ? "opacity-80" : "text-muted"}>{label}</dt>
      <dd className="text-sm font-semibold tabular-nums">{value}</dd>
      {hint && <span className={strong ? "opacity-70" : "text-muted"}>({hint})</span>}
    </div>
  );
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={(e) => {
        (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
        onClick();
      }}
      className="rounded-md px-2.5 py-1.5 text-left hover:bg-surface-2"
    >
      {children}
    </button>
  );
}
