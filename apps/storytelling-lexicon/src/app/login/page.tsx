import type { Metadata } from "next";
import { signIn } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in" };

type Props = { searchParams: Promise<{ next?: string; sent?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, sent, error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 pt-8">
      <h1 className="font-serif text-3xl font-medium">Sign in</h1>
      {!isSupabaseConfigured ? (
        <p className="text-muted">The catalog needs Supabase. Add the keys from <code>.env.example</code> to turn it on.</p>
      ) : sent ? (
        <p className="text-muted">Check your email for a sign-in link.</p>
      ) : (
        <form action={signIn} className="flex flex-col gap-3">
          <p className="text-sm text-muted">The glossary is public; the catalog is private. We&apos;ll email you a link.</p>
          <input type="hidden" name="next" value={next ?? "/catalog"} />
          <input name="email" type="email" required placeholder="you@example.com" className="field" aria-label="Email" />
          <button className="btn btn-primary">Email me a link</button>
          {error && <p className="text-sm text-accent">{error}</p>}
        </form>
      )}
    </div>
  );
}
