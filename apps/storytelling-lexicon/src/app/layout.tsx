import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"] });

export const metadata: Metadata = {
  title: { default: "Storytelling Lexicon", template: "%s · Storytelling Lexicon" },
  description: "A glossary of storytelling plots, arcs, structures, archetypes, tropes, devices and motifs.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = isSupabaseConfigured ? await getUser() : null;

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${fraunces.variable} font-sans antialiased`}>
        <header className="border-b border-rule">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
            <Link href="/" className="font-serif text-xl font-semibold tracking-tight">
              Storytelling <span className="italic text-accent">Lexicon</span>
            </Link>
            <nav className="order-last flex basis-full flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted sm:order-none sm:flex-1 sm:basis-auto">
              <Link href="/browse/trope" className="hover:text-ink">Index</Link>
              <Link href="/structures" className="hover:text-ink">Structures</Link>
              <Link href="/playing-with" className="hover:text-ink">Playing with</Link>
              {user && <Link href="/catalog" className="hover:text-ink">Catalog</Link>}
            </nav>
            <form action="/search" className="order-last w-full sm:order-none sm:w-56">
              <input name="q" type="search" placeholder="Search the lexicon…" className="field py-1.5 text-sm" aria-label="Search" />
            </form>
            {user ? (
              <Link href="/log" className="btn btn-primary ml-auto py-1.5 sm:ml-0">+ Log</Link>
            ) : (
              isSupabaseConfigured && <Link href="/login" className="ml-auto text-sm text-muted hover:text-ink sm:ml-0">Sign in</Link>
            )}
          </div>
        </header>

        {!isSupabaseConfigured && (
          <div className="border-b border-rule bg-accent-soft/60 px-4 py-2 text-center text-xs text-muted">
            Preview mode — reading the bundled glossary. Connect Supabase to enable search ranking, imports and your catalog.
          </div>
        )}

        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</main>

        <footer className="mx-auto max-w-5xl border-t border-rule px-4 py-8 text-xs leading-relaxed text-faint sm:px-6">
          Descriptions marked as such come from{" "}
          <a href="https://tvtropes.org" className="underline">TV Tropes</a> and are shared under{" "}
          <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" className="underline">CC BY-NC-SA 3.0</a>; the
          glossary as a whole is shared under the same licence. Code is MIT.
        </footer>
      </body>
    </html>
  );
}
