"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { uniqueId } from "@/lib/store";
import { RATING_LABELS, currentYM, defaultGlyph, descendants, ratingArcPath } from "@/lib/tree";
import type { Branch, SelfInfo, Skill, TreeData } from "@/lib/types";

const NEW_BRANCH = "__new__";
const PALETTE = ["#2f5d8a", "#9b2c2c", "#8a6a1f", "#7a3b6e", "#2e6b5e", "#a0522d", "#3b5f3b", "#5b4a8a"];

function Dialog({ title, onCancel, children }: { title: string; onCancel: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
  }, []);
  return (
    <div className="st-modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={ref} className="st-modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function RatingPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="st-rating-picker" role="radiogroup" aria-label="Self rating">
      <svg viewBox="-40 -40 80 26" width="120" height="40" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={ratingArcPath(32, i)}
            className={`st-meter-arc is-clickable ${i < value ? "is-filled" : ""}`}
            onClick={() => onChange(i + 1)}
          />
        ))}
      </svg>
      <div className="st-rating-buttons">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            className={`st-chip ${value === n ? "is-on" : ""}`}
            onClick={() => onChange(n)}
            title={RATING_LABELS[n - 1]}
          >
            {n}
          </button>
        ))}
        <span className="st-muted">{RATING_LABELS[value - 1]}</span>
      </div>
    </div>
  );
}

interface SkillFormProps {
  data: TreeData;
  initial?: Skill;
  defaults: { branchId?: string; parentId?: string | null };
  onCancel: () => void;
  onSave: (skill: Skill) => void;
  onAddBranch: (b: Branch) => void;
}

export function SkillForm({ data, initial, defaults, onCancel, onSave, onAddBranch }: SkillFormProps) {
  const today = currentYM(new Date());
  const [name, setName] = useState(initial?.name ?? "");
  const [glyph, setGlyph] = useState(initial?.glyph ?? "");
  const [branchId, setBranchId] = useState(initial?.branchId ?? defaults.branchId ?? data.branches[0]?.id ?? NEW_BRANCH);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchColor, setNewBranchColor] = useState(PALETTE[data.branches.length % PALETTE.length]);
  const [parentId, setParentId] = useState<string>(initial?.parentId ?? defaults.parentId ?? "");
  const [started, setStarted] = useState(initial?.started ?? today);
  const [ongoing, setOngoing] = useState(initial ? initial.lastActive === "present" : true);
  const [lastActive, setLastActive] = useState(
    initial && initial.lastActive !== "present" ? initial.lastActive : today,
  );
  const [rating, setRating] = useState(initial?.rating ?? 3);
  const [note, setNote] = useState(initial?.note ?? "");
  const [creds, setCreds] = useState((initial?.credentials ?? []).join("\n"));
  const [error, setError] = useState<string | null>(null);

  const parentOptions = useMemo(() => {
    if (branchId === NEW_BRANCH) return [];
    const blocked = initial ? descendants(data, initial.id) : new Set<string>();
    if (initial) blocked.add(initial.id);
    return data.skills.filter((s) => s.branchId === branchId && !blocked.has(s.id));
  }, [branchId, data, initial]);

  useEffect(() => {
    if (parentId && !parentOptions.some((p) => p.id === parentId)) setParentId("");
  }, [parentId, parentOptions]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Give the skill a name.");
    if (!/^\d{4}-\d{2}$/.test(started)) return setError("Pick a start month.");
    if (!ongoing && !/^\d{4}-\d{2}$/.test(lastActive)) return setError("Pick when you last practiced it.");
    if (!ongoing && lastActive < started) return setError("Last practiced can’t be before you started.");

    let finalBranch = branchId;
    if (branchId === NEW_BRANCH) {
      const bName = newBranchName.trim();
      if (!bName) return setError("Name the new branch.");
      finalBranch = uniqueId(bName, data.branches.map((b) => b.id));
      onAddBranch({ id: finalBranch, name: bName, color: newBranchColor, glyph: bName[0].toUpperCase() });
    }

    const credentials = creds
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    onSave({
      id: initial?.id ?? uniqueId(trimmed, data.skills.map((s) => s.id)),
      name: trimmed,
      branchId: finalBranch,
      parentId: parentId || null,
      glyph: glyph.trim() || defaultGlyph(trimmed),
      started,
      lastActive: ongoing ? "present" : lastActive,
      rating,
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(credentials.length ? { credentials } : {}),
    });
  };

  return (
    <Dialog title={initial ? `Edit ${initial.name}` : "New skill"} onCancel={onCancel}>
      <form className="st-form" onSubmit={submit}>
        <div className="st-row">
          <label className="st-field st-grow">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rock climbing" />
          </label>
          <label className="st-field st-glyph-field">
            <span>Glyph</span>
            <input
              value={glyph}
              maxLength={3}
              onChange={(e) => setGlyph(e.target.value)}
              placeholder={name ? defaultGlyph(name) : "RC"}
            />
          </label>
        </div>

        <div className="st-row">
          <label className="st-field st-grow">
            <span>Branch</span>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {data.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
              <option value={NEW_BRANCH}>+ New branch…</option>
            </select>
          </label>
          <label className="st-field st-grow">
            <span>Grew from</span>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} disabled={branchId === NEW_BRANCH}>
              <option value="">— branch root —</option>
              {parentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {branchId === NEW_BRANCH && (
          <div className="st-row">
            <label className="st-field st-grow">
              <span>New branch name</span>
              <input value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} placeholder="e.g. Outdoors" />
            </label>
            <label className="st-field">
              <span>Color</span>
              <input type="color" value={newBranchColor} onChange={(e) => setNewBranchColor(e.target.value)} />
            </label>
          </div>
        )}

        <div className="st-row">
          <label className="st-field st-grow">
            <span>Started</span>
            <input type="month" value={started} max={today} onChange={(e) => setStarted(e.target.value)} />
          </label>
          <label className="st-field st-grow">
            <span>Last practiced</span>
            <input
              type="month"
              value={ongoing ? "" : lastActive}
              max={today}
              disabled={ongoing}
              onChange={(e) => setLastActive(e.target.value)}
            />
          </label>
        </div>
        <label className="st-check">
          <input type="checkbox" checked={ongoing} onChange={(e) => setOngoing(e.target.checked)} />
          <span>Still practicing (ongoing)</span>
        </label>

        <div className="st-field">
          <span>Self rating</span>
          <RatingPicker value={rating} onChange={setRating} />
        </div>

        <label className="st-field">
          <span>Note</span>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="A line about what this involved" />
        </label>
        <label className="st-field">
          <span>Credentials (one per line)</span>
          <textarea rows={2} value={creds} onChange={(e) => setCreds(e.target.value)} placeholder="Belts, certifications, awards…" />
        </label>

        {error && <p className="st-error">{error}</p>}
        <div className="st-actions st-actions-end">
          <button type="button" className="st-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="st-btn st-btn-primary">
            {initial ? "Save" : "Add skill"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function SelfForm({ initial, onCancel, onSave }: { initial: SelfInfo; onCancel: () => void; onSave: (s: SelfInfo) => void }) {
  const [name, setName] = useState(initial.name);
  const [title, setTitle] = useState(initial.title);
  const [glyph, setGlyph] = useState(initial.glyph);
  const [bio, setBio] = useState(initial.bio ?? "");

  return (
    <Dialog title="Edit profile" onCancel={onCancel}>
      <form
        className="st-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            name: name.trim() || initial.name,
            title: title.trim(),
            glyph: glyph.trim() || "✦",
            ...(bio.trim() ? { bio: bio.trim() } : {}),
          });
        }}
      >
        <div className="st-row">
          <label className="st-field st-grow">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="st-field st-glyph-field">
            <span>Glyph</span>
            <input value={glyph} maxLength={3} onChange={(e) => setGlyph(e.target.value)} />
          </label>
        </div>
        <label className="st-field">
          <span>Tagline</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="st-field">
          <span>Bio</span>
          <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>
        <div className="st-actions st-actions-end">
          <button type="button" className="st-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="st-btn st-btn-primary">
            Save
          </button>
        </div>
      </form>
    </Dialog>
  );
}
