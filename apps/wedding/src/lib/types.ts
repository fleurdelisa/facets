/** How a guest is tied to the person they hang off of in the tree. */
export type Relation = "blood" | "inlaw" | "friend";

export type Rsvp = "pending" | "yes" | "no";

export interface Person {
  id: string;
  name: string;
  /** Id of the person this guest connects to, or COUPLE_ID for shared friends. Null only for the couple. */
  connectedTo: string | null;
  /** Tie to `connectedTo`. Ignored for the couple themselves. */
  relation: Relation;
  /** Short description of the relationship, e.g. "Mom", "College roommate". */
  label?: string;
  /** ISO date, YYYY-MM-DD. */
  birthday?: string;
  /** Acquaintance notes: how we know them, things to remember. */
  notes?: string;
  rsvp: Rsvp;
  plusOne?: boolean;
  dietary?: string;
  email?: string;
  phone?: string;
}

export interface GuestData {
  version: 1;
  people: Person[];
}

export const PARTNER_LEFT = "partner-left";
export const PARTNER_RIGHT = "partner-right";
/** Pseudo-node at the midpoint between the couple; shared friends connect here. */
export const COUPLE_ID = "couple";

export const PARTNER_IDS = [PARTNER_LEFT, PARTNER_RIGHT] as const;

export const isPartner = (id: string) => id === PARTNER_LEFT || id === PARTNER_RIGHT;

export const RELATION_LABEL: Record<Relation, string> = {
  blood: "Blood relative",
  inlaw: "In-law / partner",
  friend: "Friend",
};

export const RSVP_LABEL: Record<Rsvp, string> = {
  pending: "Awaiting reply",
  yes: "Attending",
  no: "Declined",
};
