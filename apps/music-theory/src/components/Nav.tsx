"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Circle of Fifths" },
  { href: "/math", label: "Sound & Math" },
  { href: "/scales", label: "East Asian Scales" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          <span className="text-accent">♪</span> Music Theory
        </Link>
        <nav className="-mx-1 flex max-w-full gap-1 overflow-x-auto text-[13px] sm:text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-2.5 py-1.5 transition-colors sm:px-3 ${
                path === l.href ? "bg-foreground text-background" : "text-muted hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
