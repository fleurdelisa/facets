import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createWork } from "@/app/actions";
import { listWorks } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { MEDIA, WORK_STATUS_LABEL, WORK_STATUSES } from "@/lib/types";

export const metadata: Metadata = { title: "Catalog" };

export default async function CatalogPage() {
  if (!isSupabaseConfigured) redirect("/login");
  const works = await listWorks();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="eyebrow">Private</p>
          <h1 className="font-serif text-4xl font-medium">Your catalog</h1>
          <p className="text-muted">Everything you&apos;re watching and reading, and what you&apos;ve spotted in it.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/entries/new" className="btn btn-ghost">New entry</Link>
          <Link href="/log" className="btn btn-primary">+ Log a sighting</Link>
        </div>
      </header>

      <details className="rounded-xl border border-rule bg-card p-4 [&[open]>summary]:mb-4">
        <summary className="cursor-pointer font-medium">Add a work</summary>
        <form action={createWork} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
          <input name="title" required placeholder="Title" className="field" aria-label="Title" />
          <select name="medium" className="field" aria-label="Medium">
            {MEDIA.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input name="year" type="number" placeholder="Year" className="field sm:w-24" aria-label="Year" />
          <select name="status" className="field" aria-label="Status" defaultValue="in_progress">
            {WORK_STATUSES.map((s) => <option key={s} value={s}>{WORK_STATUS_LABEL[s]}</option>)}
          </select>
          <button className="btn btn-primary">Add</button>
        </form>
      </details>

      {works.length === 0 ? (
        <p className="text-muted">Nothing here yet. Add what you&apos;re watching, then log what you notice.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((w) => (
            <li key={w.id}>
              <Link href={`/catalog/${w.id}`} className="group flex h-full flex-col gap-2 rounded-xl border border-rule bg-card p-4 hover:border-accent">
                <span className="eyebrow">{w.medium}{w.year ? ` · ${w.year}` : ""}</span>
                <span className="font-serif text-xl font-medium group-hover:text-accent">{w.title}</span>
                <span className="mt-auto flex justify-between text-sm text-muted">
                  <span>{WORK_STATUS_LABEL[w.status]}</span>
                  <span className="tabular-nums">{w.sighting_count} logged</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
