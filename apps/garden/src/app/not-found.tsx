import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1>Nothing grows here</h1>
      <p className="muted">That page doesn&rsquo;t exist, or it hasn&rsquo;t been planted yet.</p>
      <Link href="/">← Back to the map</Link>
    </div>
  );
}
