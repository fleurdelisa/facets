import { Person, Relation, RSVP_LABEL, Rsvp } from "@/lib/types";

export const TIE_COLOR: Record<Relation, string> = {
  blood: "var(--tie-blood)",
  inlaw: "var(--tie-inlaw)",
  friend: "var(--tie-friend)",
};

export const TIE_DASH: Record<Relation, string | undefined> = {
  blood: undefined,
  inlaw: "9 6",
  friend: "0.5 5.5",
};

export const TIE_SHORT: Record<Relation, string> = {
  blood: "Blood",
  inlaw: "In-law",
  friend: "Friend",
};

/** A short sample of the line style used for a relation in the tree. */
export function TieGlyph({ relation, width = 28 }: { relation: Relation; width?: number }) {
  return (
    <svg width={width} height={8} aria-hidden className="shrink-0">
      <line
        x1={2}
        y1={4}
        x2={width - 2}
        y2={4}
        stroke={TIE_COLOR[relation]}
        strokeWidth={relation === "friend" ? 2.5 : 2}
        strokeDasharray={TIE_DASH[relation]}
        strokeLinecap="round"
      />
    </svg>
  );
}

const RSVP_STYLE: Record<Rsvp, string> = {
  yes: "bg-rsvp-yes-soft text-rsvp-yes",
  pending: "bg-rsvp-pending-soft text-rsvp-pending",
  no: "bg-rsvp-no-soft text-rsvp-no",
};

export const RSVP_DOT: Record<Rsvp, string> = {
  yes: "bg-rsvp-yes",
  pending: "bg-rsvp-pending",
  no: "bg-rsvp-no",
};

export function RsvpBadge({ rsvp }: { rsvp: Rsvp }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${RSVP_STYLE[rsvp]}`}>
      <span className={`size-1.5 rounded-full ${RSVP_DOT[rsvp]}`} />
      {RSVP_LABEL[rsvp]}
    </span>
  );
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({ person, size = 36 }: { person: Person; size?: number }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-serif font-semibold text-foreground ring-2 ${
        person.rsvp === "yes" ? "ring-rsvp-yes" : person.rsvp === "pending" ? "ring-rsvp-pending" : "ring-rsvp-no"
      }`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {initials(person.name)}
    </span>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Apr 12, 1966 · turns 61 in 5 months" — parsed by hand so the date never shifts with time zones. */
export function describeBirthday(iso: string, today = new Date()): { date: string; detail: string } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const date = `${MONTHS[mo]} ${d}, ${y}`;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(t.getFullYear(), mo, d);
  if (next < t) next = new Date(t.getFullYear() + 1, mo, d);
  const days = Math.round((next.getTime() - t.getTime()) / 86_400_000);
  const age = next.getFullYear() - y;
  const when = days === 0 ? "today!" : days === 1 ? "tomorrow" : days < 45 ? `in ${days} days` : `in ${Math.round(days / 30.4)} months`;
  return { date, detail: age > 0 ? `turns ${age} ${when}` : `birthday ${when}` };
}
