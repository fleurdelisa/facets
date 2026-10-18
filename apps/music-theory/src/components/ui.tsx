import type { ReactNode } from "react";

export function Card({ title, aside, children, className = "" }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      {(title || aside) && (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Pill({ active, onClick, children, title }: { active?: boolean; onClick?: () => void; children: ReactNode; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active ? "border-foreground bg-foreground text-background" : "border-border hover:border-muted"
      }`}
    >
      {children}
    </button>
  );
}

export function PlayButton({ onClick, children = "Play", title }: { onClick: () => void; children?: ReactNode; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-medium text-white transition-opacity hover:opacity-85 dark:text-black"
    >
      <span aria-hidden>▶</span>
      {children}
    </button>
  );
}
