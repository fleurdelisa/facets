# Skill Tree

A video-game style skill tree of everything I've invested time in learning.

- **Center orb** is me. **Branches** (Languages, Martial Arts, Career, …) orbit it, and skills hang off the branches. A skill can grow out of another skill (e.g. Embedded Linux → Cloud Security → AI Security).
- **Recency** drives the look: skills practiced in the last 6 months are full color with bold lines; they fade to grayscale and thin lines over 5 years of inactivity. Ongoing skills (`"lastActive": "present"`) stay fully lit.
- **Hover** a skill to see its 1–5 self-rating as arc segments over the circle, plus a tooltip. **Click** for the detail panel.
- **Light mode** is a self-healing cutting mat (grid that pans/zooms with the tree, edge rulers, protractor guides); **dark mode** is cyber with a red/blue anaglyph offset. The toggle remembers your choice and defaults to the system setting.
- Drag to pan, scroll/pinch to zoom, `⛶` to re-fit.

## Data

Everything lives in [`src/data/tree.json`](src/data/tree.json):

```jsonc
{
  "id": "cloud-security",
  "name": "Cloud Security",
  "branchId": "career",
  "parentId": "embedded",      // optional: the skill this grew from (same branch)
  "glyph": "☁",                // 1–3 chars shown in the circle
  "started": "2019-09",
  "lastActive": "2024-02",     // or "present"
  "rating": 4,                 // 1–5
  "note": "One-liner shown on hover",
  "credentials": ["…"]
}
```

## Editing

Editing is on automatically in `pnpm dev`. On a deployed site, open it with `?edit` once to turn editing on in that browser (`?edit=off` turns it off).

- Hover the center orb → click the grey **⊕** to add a skill (or use **+ Skill** in the header).
- Click a skill → **Edit**, **+ Follow-up skill**, or **Delete**.
- Edits are saved in the browser's local storage only. Click **Export** to download `tree.json`, replace `src/data/tree.json` with it, and commit. **Reset** discards local edits.

## Development

```bash
pnpm install --ignore-workspace
pnpm dev        # http://localhost:3000
pnpm build
```
