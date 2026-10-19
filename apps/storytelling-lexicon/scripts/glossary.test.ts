import assert from "node:assert/strict";
import { test } from "node:test";
import { seedEntries, seedRelations } from "../src/data/glossary";
import { LAYERS } from "../src/lib/types";

test("slugs are unique and url-safe", () => {
  const seen = new Set<string>();
  for (const e of seedEntries) {
    assert.match(e.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, e.slug);
    assert.ok(!seen.has(e.slug), `duplicate slug ${e.slug}`);
    seen.add(e.slug);
  }
});

test("every entry has a layer and a summary", () => {
  for (const e of seedEntries) {
    assert.ok(LAYERS.includes(e.layer), `${e.slug}: bad layer ${e.layer}`);
    assert.ok(e.summary.trim().length > 0, `${e.slug}: empty summary`);
  }
});

test("relations point at existing entries, without duplicates", () => {
  const slugs = new Set(seedEntries.map((e) => e.slug));
  const keys = new Set<string>();
  for (const r of seedRelations) {
    assert.ok(slugs.has(r.from), `unknown from: ${r.from}`);
    assert.ok(slugs.has(r.to), `unknown to: ${r.to}`);
    assert.notEqual(r.from, r.to);
    const key = `${r.from}|${r.to}|${r.kind}`;
    assert.ok(!keys.has(key), `duplicate relation ${key}`);
    keys.add(key);
  }
});

test("beats belong to a structure and spans are sane", () => {
  const bySlug = new Map(seedEntries.map((e) => [e.slug, e]));
  for (const e of seedEntries.filter((e) => e.layer === "beat")) {
    const stage = seedRelations.find((r) => r.from === e.slug && r.kind === "stage_of");
    assert.ok(stage, `${e.slug} has no structure`);
    assert.equal(bySlug.get(stage.to)?.layer, "structure");
    assert.ok(stage.start! >= 0 && stage.end! <= 1 && stage.start! < stage.end!, e.slug);
  }
});

test("arcs have points within [-1, 1]", () => {
  for (const e of seedEntries.filter((e) => e.layer === "arc")) {
    assert.ok(e.arc && e.arc.length >= 3, e.slug);
    assert.ok(e.arc.every((p) => p >= -1 && p <= 1), e.slug);
  }
});
