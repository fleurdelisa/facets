"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  hint: string | null;
}

export default function SearchBar({ value, onChange, onSubmit, hint }: SearchBarProps) {
  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Search words</span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]"
        >
          <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
            if (e.key === "Escape") onChange("");
          }}
          placeholder="Search a word… (try “chai”)"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper-raised)] py-2.5 pr-3 pl-10 text-[15px] text-[var(--ink)] shadow-sm outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
      </label>
      <p className="mt-2 min-h-[1.25rem] px-1 text-xs text-[var(--ink-faint)]" aria-live="polite">
        {hint}
      </p>
    </div>
  );
}
