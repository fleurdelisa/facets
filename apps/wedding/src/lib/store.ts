"use client";

import { useCallback, useEffect, useState } from "react";
import { sampleData } from "./sample-data";
import { GuestData, PARTNER_IDS, Person, isPartner } from "./types";

const STORAGE_KEY = "facets.wedding.guests.v1";

function load(): GuestData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = parseGuestData(raw);
      if (parsed) return parsed;
    }
  } catch {
    // Storage unavailable (private mode, blocked) — fall through to sample data.
  }
  return sampleData();
}

export function parseGuestData(raw: string): GuestData | null {
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.people)) return null;
    const people: Person[] = data.people
      .filter(
        (p: Partial<Person>) =>
          p && typeof p.id === "string" && typeof p.name === "string",
      )
      .map((p: Person) => ({
        ...p,
        rsvp: p.rsvp === "yes" || p.rsvp === "no" ? p.rsvp : "pending",
        relation:
          p.relation === "blood" || p.relation === "friend"
            ? p.relation
            : "inlaw",
        connectedTo: isPartner(p.id) ? null : p.connectedTo,
      }));
    for (const id of PARTNER_IDS) {
      if (!people.some((p) => p.id === id)) {
        people.unshift(sampleData().people.find((p) => p.id === id)!);
      }
    }
    return { version: 1, people };
  } catch {
    return null;
  }
}

export function newId() {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useGuestStore() {
  // Start from sample data so server and first client render match, then swap in saved data.
  const [data, setData] = useState<GuestData>(sampleData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(load());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota / privacy errors; the session still works in memory.
    }
  }, [data, loaded]);

  const updatePerson = useCallback((id: string, patch: Partial<Person>) => {
    setData((d) => ({
      ...d,
      people: d.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const addPerson = useCallback((person: Person) => {
    setData((d) => ({ ...d, people: [...d.people, person] }));
  }, []);

  /** Removes a guest; anyone connected through them is re-attached to their parent. */
  const removePerson = useCallback((id: string) => {
    if (isPartner(id)) return;
    setData((d) => {
      const target = d.people.find((p) => p.id === id);
      if (!target) return d;
      return {
        ...d,
        people: d.people
          .filter((p) => p.id !== id)
          .map((p) =>
            p.connectedTo === id
              ? { ...p, connectedTo: target.connectedTo }
              : p,
          ),
      };
    });
  }, []);

  const replaceAll = useCallback((next: GuestData) => setData(next), []);
  const reset = useCallback(() => setData(sampleData()), []);

  return {
    data,
    loaded,
    updatePerson,
    addPerson,
    removePerson,
    replaceAll,
    reset,
  };
}
