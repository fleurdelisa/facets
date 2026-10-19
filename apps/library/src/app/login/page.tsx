export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/", error } = await searchParams;
  return (
    <form action="/api/session" method="post" className="mx-auto mt-12 max-w-sm space-y-4">
      <h1 className="font-serif text-3xl">Welcome back</h1>
      <input type="hidden" name="next" value={next} />
      <input
        type="password"
        name="token"
        required
        autoFocus
        placeholder="Access token"
        className="w-full rounded-lg border border-line bg-card px-3 py-2 focus:border-accent focus:outline-none"
      />
      {error && <p className="text-sm text-danger">That token didn’t match.</p>}
      <button className="w-full rounded-lg bg-accent py-2 font-medium text-on-accent hover:bg-accent/90">Unlock</button>
    </form>
  );
}
