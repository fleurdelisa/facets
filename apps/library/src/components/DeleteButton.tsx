"use client";

import { useTransition } from "react";
import { deleteQuote } from "@/app/actions";

export function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this quote? This can't be undone.")) start(() => deleteQuote(id));
      }}
      className="rounded-lg border border-line px-3 py-1.5 text-sm text-danger transition hover:border-danger/50 hover:bg-danger/5 disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
