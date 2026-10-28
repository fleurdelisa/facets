# Wedding planner

Micro-app for planning the wedding. The first feature is the **guest tree**.

## Guest tree

- The couple sits in the middle, joined by a dashed line.
- Each partner's family grows **up and outward** (left partner to the left, right partner to the right).
- Friends hang **below**: each partner's friends on their side, shared friends from the center.
- Line styles show the tie to the person a guest connects through:
  solid = blood, dashed = in-law / partner, dotted = friend.
- Every node with people connected through it shows a badge with the size of that branch;
  each section shows its total, and the header shows the grand total, RSVP breakdown and plus-ones.
- Hover a person to preview their card, click to open it (edit details, quick RSVP, add a
  relative/in-law/friend connected to them, or remove them).
- Drag to pan, scroll or pinch to zoom.
- **List view** shows the same data grouped by section, indented by branch, with search,
  RSVP filters and inline RSVP editing.

Data is stored in the browser's `localStorage`. Use the `•••` menu to export/import JSON or reset to the sample data.

## Data model

Each guest has a `connectedTo` (the person they hang off of, or `couple` for shared friends)
and a `relation` (`blood` | `inlaw` | `friend`) describing that link. Branch counts are the
size of each person's subtree. See `src/lib/types.ts`.

## Development

```bash
npm run dev   # http://localhost:3003
```
