"use client";

import { useCallback, useEffect, useState } from "react";
import seed from "@/data/tree.json";
import { descendants, slugify } from "./tree";
import type { Branch, SelfInfo, Skill, TreeData } from "./types";

const STORAGE_KEY = "facets.skill-tree.v1";
const EDIT_KEY = "facets.skill-tree.edit";

export const SEED = seed as TreeData;

function isTreeData(v: unknown): v is TreeData {
  const t = v as TreeData;
  return !!t && t.version === 1 && !!t.self && Array.isArray(t.branches) && Array.isArray(t.skills);
}

export function uniqueId(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = slugify(base);
  if (!used.has(root)) return root;
  let i = 2;
  while (used.has(`${root}-${i}`)) i++;
  return `${root}-${i}`;
}

/**
 * Tree state. The seed JSON is what visitors see; local edits are kept in
 * this browser's storage until exported back into `src/data/tree.json`.
 */
export function useTreeStore() {
  const [data, setData] = useState<TreeData>(SEED);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isTreeData(parsed)) {
          setData(parsed);
          setDirty(true);
        }
      }
    } catch {
      /* storage unavailable or corrupt: fall back to the seed */
    }
    setLoaded(true);
  }, []);

  const commit = useCallback((update: (prev: TreeData) => TreeData) => {
    setData((prev) => {
      const next = update(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setDirty(true);
  }, []);

  const saveSkill = useCallback(
    (skill: Skill) =>
      commit((prev) => {
        const existing = prev.skills.find((s) => s.id === skill.id);
        let skills = existing
          ? prev.skills.map((s) => (s.id === skill.id ? skill : s))
          : [...prev.skills, skill];
        // Moving a skill to another branch carries its subtree along.
        if (existing && existing.branchId !== skill.branchId) {
          const sub = descendants(prev, skill.id);
          skills = skills.map((s) => (sub.has(s.id) ? { ...s, branchId: skill.branchId } : s));
        }
        return { ...prev, skills };
      }),
    [commit],
  );

  const deleteSkill = useCallback(
    (id: string) =>
      commit((prev) => {
        const target = prev.skills.find((s) => s.id === id);
        return {
          ...prev,
          skills: prev.skills
            .filter((s) => s.id !== id)
            .map((s) => (s.parentId === id ? { ...s, parentId: target?.parentId ?? null } : s)),
        };
      }),
    [commit],
  );

  const addBranch = useCallback(
    (branch: Branch) => commit((prev) => ({ ...prev, branches: [...prev.branches, branch] })),
    [commit],
  );

  const deleteBranch = useCallback(
    (id: string) =>
      commit((prev) =>
        prev.skills.some((s) => s.branchId === id)
          ? prev
          : { ...prev, branches: prev.branches.filter((b) => b.id !== id) },
      ),
    [commit],
  );

  const saveSelf = useCallback((self: SelfInfo) => commit((prev) => ({ ...prev, self })), [commit]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setData(SEED);
    setDirty(false);
  }, []);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tree.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  return { data, loaded, dirty, saveSkill, deleteSkill, addBranch, deleteBranch, saveSelf, reset, exportJson };
}

export type TreeStore = ReturnType<typeof useTreeStore>;

/**
 * Editing is on in development. On a deployed site, visit with `?edit` to
 * turn it on for this browser and `?edit=off` to turn it off again.
 */
export function useEditMode(): boolean {
  const [editable, setEditable] = useState(false);
  useEffect(() => {
    let on = process.env.NODE_ENV !== "production";
    try {
      const param = new URLSearchParams(window.location.search).get("edit");
      if (param !== null) {
        if (param === "off" || param === "0") localStorage.removeItem(EDIT_KEY);
        else localStorage.setItem(EDIT_KEY, "1");
      }
      if (localStorage.getItem(EDIT_KEY) === "1") on = true;
      if (param === "off" || param === "0") on = false;
    } catch {
      /* ignore */
    }
    setEditable(on);
  }, []);
  return editable;
}
