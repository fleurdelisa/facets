import type { Metadata } from "next";
import { createEntry } from "@/app/actions";
import { LAYER_INFO, LAYERS } from "@/lib/types";

export const metadata: Metadata = { title: "New entry" };

export default function NewEntryPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-medium">New entry</h1>
        <p className="text-muted">For something the lexicon doesn&apos;t have yet. Only you can see your entries.</p>
      </div>
      <form action={createEntry} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Name
          <input name="name" required className="field" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Layer
          <select name="layer" defaultValue="trope" className="field">
            {LAYERS.map((l) => <option key={l} value={l}>{LAYER_INFO[l].label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          One-line summary
          <input name="summary" className="field" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Also known as <span className="text-faint">(comma-separated)</span>
          <input name="aliases" className="field" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Description
          <textarea name="description" rows={6} className="field" />
        </label>
        <button className="btn btn-primary self-start">Create entry</button>
      </form>
    </div>
  );
}
