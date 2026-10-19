import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 pt-8">
      <p className="eyebrow">404</p>
      <h1 className="font-serif text-4xl font-medium">Not in the lexicon (yet)</h1>
      <Link href="/" className="btn btn-ghost">Back to the index</Link>
    </div>
  );
}
