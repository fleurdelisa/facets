"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Layout, Point, computeLayout, edgePath } from "@/lib/layout";
import {
  GuestTree,
  TreeNode,
  sectionTitle,
  subtreeIds,
  totals,
} from "@/lib/tree";
import {
  PARTNER_LEFT,
  PARTNER_RIGHT,
  Person,
  RSVP_LABEL,
  Relation,
  isGroup,
} from "@/lib/types";
import { Avatar, TIE_COLOR, TIE_DASH, TIE_SHORT, TieGlyph } from "./atoms";
import { PersonDetails } from "./PersonCard";

interface View {
  x: number;
  y: number;
  k: number;
}

interface Hover {
  id: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const MIN_K = 0.15;
const MAX_K = 2.5;
const DRAG_THRESHOLD = 4;

export function TreeView({
  tree,
  selectedId,
  onSelect,
  expanded,
  onToggleGroup,
  onSetAllGroups,
}: {
  tree: GuestTree;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Groups currently unfolded; every other group shows as a single node. */
  expanded: Set<string>;
  onToggleGroup: (id: string) => void;
  onSetAllGroups: (expand: boolean) => void;
}) {
  const collapsed = useMemo(
    () =>
      new Set(
        [...tree.byId.values()]
          .filter((p) => isGroup(p) && !expanded.has(p.id))
          .map((p) => p.id),
      ),
    [tree, expanded],
  );
  const layout = useMemo(
    () => computeLayout(tree, collapsed),
    [tree, collapsed],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<Hover | null>(null);
  const [dragging, setDragging] = useState(false);
  const fitted = useRef(false);

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width: w, height: h } = el.getBoundingClientRect();
    const { minX, maxX, minY, maxY } = layout.bounds;
    const k = clamp(
      Math.min(w / (maxX - minX + 80), h / (maxY - minY + 80), 1.1),
      MIN_K,
      MAX_K,
    );
    setView({
      k,
      x: w / 2 - ((minX + maxX) / 2) * k,
      y: h / 2 - ((minY + maxY) / 2) * k,
    });
  }, [layout.bounds]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      if (!fitted.current && entry.contentRect.width > 0) {
        fitted.current = true;
        fit();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  // Wheel zoom around the cursor. Registered by hand because React's wheel listener is passive.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      // Trackpad pinch arrives as ctrl+wheel with small deltas, so it gets a stronger factor.
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      setView((v) => zoomAt(v, px, py, factor));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Active pointers, for one-finger/mouse panning and two-finger pinch zoom.
  const pointers = useRef(new Map<number, Point>());
  const drag = useRef<{
    start: Point;
    view: View;
    moved: boolean;
    pinch?: { dist: number; mid: Point };
  } | null>(null);

  const local = (e: React.PointerEvent): Point => {
    const r = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, local(e));
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      drag.current = { start: pts[0], view, moved: false };
    } else if (pts.length === 2) {
      for (const id of pointers.current.keys())
        containerRef.current?.setPointerCapture(id);
      drag.current = {
        start: pts[0],
        view,
        moved: true,
        pinch: {
          dist: distance(pts[0], pts[1]),
          mid: midpoint(pts[0], pts[1]),
        },
      };
      setHover(null);
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, local(e));
    const pts = [...pointers.current.values()];

    if (d.pinch && pts.length >= 2) {
      const mid = midpoint(pts[0], pts[1]);
      const k = clamp(
        d.view.k * (distance(pts[0], pts[1]) / d.pinch.dist),
        MIN_K,
        MAX_K,
      );
      const ratio = k / d.view.k;
      setView({
        k,
        x: mid.x - (d.pinch.mid.x - d.view.x) * ratio,
        y: mid.y - (d.pinch.mid.y - d.view.y) * ratio,
      });
      return;
    }

    const dx = pts[0].x - d.start.x;
    const dy = pts[0].y - d.start.y;
    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      d.moved = true;
      setDragging(true);
      setHover(null);
      // Capture only once it's a real drag, so plain clicks still reach the node buttons.
      containerRef.current?.setPointerCapture(e.pointerId);
    }
    if (d.moved) setView({ ...d.view, x: d.view.x + dx, y: d.view.y + dy });
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const rest = [...pointers.current.values()];
    if (rest.length === 1) {
      // Pinch ended with one finger still down: keep panning from here.
      drag.current = { start: rest[0], view, moved: true };
    } else if (rest.length === 0) {
      drag.current = null;
      setDragging(false);
    }
  };

  const zoomBy = (factor: number) =>
    setView((v) => zoomAt(v, size.w / 2, size.h / 2, factor));

  const showHover = (id: string, el: HTMLElement) => {
    if (drag.current?.moved || !containerRef.current) return;
    const c = containerRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setHover({
      id,
      left: r.left - c.left,
      top: r.top - c.top,
      right: r.right - c.left,
      bottom: r.bottom - c.top,
    });
  };

  const hoveredSubtree = useMemo(
    () => (hover ? subtreeIds(tree, hover.id) : null),
    [hover, tree],
  );
  const hoveredPerson = hover ? tree.byId.get(hover.id) : undefined;
  const sum = totals(tree);

  return (
    <div
      ref={containerRef}
      className={`canvas-grid relative h-full w-full touch-none overflow-hidden select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
        }}
      >
        <Edges layout={layout} highlight={hoveredSubtree} />
        <SectionLabels layout={layout} tree={tree} />

        {/* The couple's heart, with the grand total */}
        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: 0, top: 0 }}
        >
          <span className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-accent shadow-sm">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.3 4.5 6 4.1c2.1-.2 3.7.9 6 3.2 2.3-2.3 3.9-3.4 6-3.2 3.7.4 5.6 4.3 4 7.6C19.5 16.4 12 21 12 21z" />
            </svg>
          </span>
        </div>
        <div
          className="absolute -translate-x-1/2 text-center whitespace-nowrap"
          style={{ left: 0, top: 30 }}
        >
          <span className="rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
            {sum.people} guests total
          </span>
        </div>

        {[...layout.positions.entries()].map(([id, pos]) => {
          const person = tree.byId.get(id);
          if (!person) return null;
          const node = tree.nodes.get(id);
          const isCouple = id === PARTNER_LEFT || id === PARTNER_RIGHT;
          const dim = hoveredSubtree && !hoveredSubtree.has(id) && !isCouple;
          return (
            <button
              key={id}
              type="button"
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-opacity ${dim ? "opacity-40" : ""}`}
              style={{ left: pos.x, top: pos.y }}
              onMouseEnter={(e) => showHover(id, e.currentTarget)}
              onMouseLeave={() => setHover((h) => (h?.id === id ? null : h))}
              onFocus={(e) => showHover(id, e.currentTarget)}
              onBlur={() => setHover(null)}
              onClick={() => {
                setHover(null);
                onSelect(id);
              }}
              aria-label={
                isGroup(person)
                  ? `${person.name}, group of ${node?.size ?? 0}`
                  : `${person.name}${person.label ? `, ${person.label}` : ""}, ${RSVP_LABEL[person.rsvp]}${person.unlikely ? ", unlikely" : ""}`
              }
            >
              {isCouple ? (
                <PartnerNode
                  person={person}
                  tree={tree}
                  side={id === PARTNER_LEFT ? "left" : "right"}
                  selected={selectedId === id}
                />
              ) : isGroup(person) && node ? (
                <GroupNode
                  node={node}
                  selected={selectedId === id}
                  collapsed={collapsed.has(id)}
                />
              ) : (
                <GuestNode
                  person={person}
                  count={node?.size ?? 1}
                  selected={selectedId === id}
                />
              )}
            </button>
          );
        })}

        {[...layout.positions.entries()].map(([id, pos]) => {
          const person = tree.byId.get(id);
          if (
            !person ||
            !isGroup(person) ||
            !tree.nodes.get(id)?.children.length
          )
            return null;
          const open = !collapsed.has(id);
          return (
            <button
              key={`toggle-${id}`}
              type="button"
              onClick={() => onToggleGroup(id)}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm hover:border-accent hover:text-accent"
              style={{ left: pos.x + GROUP_W / 2, top: pos.y }}
              aria-label={`${open ? "Collapse" : "Expand"} ${person.name}`}
              title={open ? "Collapse group" : "Show everyone in this group"}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                {open ? <path d="M5 12h14" /> : <path d="M12 5v14M5 12h14" />}
              </svg>
            </button>
          );
        })}
      </div>

      {hover && hoveredPerson && hover.id !== selectedId && (
        <HoverCard
          hover={hover}
          size={size}
          person={hoveredPerson}
          tree={tree}
        />
      )}

      <div className="absolute top-3 left-3 flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <ToolButton label="Zoom in" onClick={() => zoomBy(1.25)}>
          <path d="M12 5v14M5 12h14" />
        </ToolButton>
        <ToolButton label="Zoom out" onClick={() => zoomBy(0.8)}>
          <path d="M5 12h14" />
        </ToolButton>
        <ToolButton label="Fit to screen" onClick={fit}>
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </ToolButton>
        <ToolButton
          label="Expand all groups"
          onClick={() => onSetAllGroups(true)}
        >
          <path d="M7 10l5-5 5 5M7 14l5 5 5-5" />
        </ToolButton>
        <ToolButton
          label="Collapse all groups"
          onClick={() => onSetAllGroups(false)}
        >
          <path d="M7 5l5 5 5-5M7 19l5-5 5 5" />
        </ToolButton>
      </div>

      <Legend />
    </div>
  );
}

function zoomAt(v: View, px: number, py: number, factor: number): View {
  const k = clamp(v.k * factor, MIN_K, MAX_K);
  const ratio = k / v.k;
  return { k, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio };
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) || 1;
const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function Edges({
  layout,
  highlight,
}: {
  layout: Layout;
  highlight: Set<string> | null;
}) {
  const left = layout.positions.get(PARTNER_LEFT)!;
  const right = layout.positions.get(PARTNER_RIGHT)!;
  return (
    <svg
      className="pointer-events-none absolute top-0 left-0 overflow-visible"
      width={1}
      height={1}
      aria-hidden
    >
      {layout.buses.map((b) => {
        const lit = highlight?.has(b.parentId);
        return (
          <path
            key={`bus-${b.parentId}`}
            d={b.d}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={lit ? 2 : 1.25}
            strokeLinecap="round"
            opacity={highlight && !lit ? 0.2 : 0.55}
          />
        );
      })}
      {layout.edges.map((e) => {
        const lit = highlight?.has(e.childId);
        return (
          <path
            key={e.id}
            d={edgePath(e.from, e.to)}
            fill="none"
            stroke={TIE_COLOR[e.relation]}
            strokeWidth={(e.relation === "friend" ? 3 : 2) * (lit ? 1.4 : 1)}
            strokeDasharray={TIE_DASH[e.relation]}
            strokeLinecap="round"
            opacity={highlight && !lit ? 0.3 : 0.9}
          />
        );
      })}
      {/* The couple: joined by marriage, so an in-law line */}
      <line
        x1={left.x}
        y1={left.y}
        x2={right.x}
        y2={right.y}
        stroke={TIE_COLOR.inlaw}
        strokeWidth={2.5}
        strokeDasharray={TIE_DASH.inlaw}
        strokeLinecap="round"
      />
    </svg>
  );
}

function SectionLabels({ layout, tree }: { layout: Layout; tree: GuestTree }) {
  return (
    <>
      {layout.labels.map((l) => {
        const s = tree.sections[l.key];
        return (
          <div
            key={l.key}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center whitespace-nowrap"
            style={{ left: l.x, top: l.y }}
          >
            <p className="font-serif text-xl font-semibold">
              {sectionTitle(l.key, tree.left, tree.right)}
            </p>
            <p className="text-xs text-muted">
              {s.size} {s.size === 1 ? "guest" : "guests"} · {s.attending}{" "}
              attending
              {s.headcount > s.size
                ? ` · ${s.headcount - s.size} plus-one${s.headcount - s.size === 1 ? "" : "s"}`
                : ""}
              {s.unlikely ? ` · ${s.unlikely} unlikely` : ""}
            </p>
          </div>
        );
      })}
    </>
  );
}

function GuestNode({
  person,
  count,
  selected,
}: {
  person: Person;
  count: number;
  selected: boolean;
}) {
  return (
    <span
      className={`relative flex w-[150px] items-center gap-2 rounded-xl border bg-surface px-2 py-1.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        selected
          ? "border-accent ring-2 ring-accent/30"
          : person.unlikely
            ? "border-dashed border-muted/60"
            : "border-border"
      } ${person.unlikely ? "opacity-60" : ""}`}
    >
      <Avatar person={person} size={30} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] leading-tight font-medium">
          {person.name}
        </span>
        {person.label && (
          <span className="block truncate text-[11px] leading-tight text-muted">
            {person.label}
          </span>
        )}
      </span>
      {count > 1 && (
        <span
          className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold text-background"
          title={`${count} people in this branch`}
        >
          {count}
        </span>
      )}
      {person.unlikely && (
        <span
          className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full border border-border bg-surface-2 text-[11px] font-bold text-muted"
          title="Unlikely to come"
        >
          ?
        </span>
      )}
      {person.plusOne && (
        <span className="absolute -bottom-2 left-8 rounded-full bg-accent-soft px-1.5 text-[10px] font-semibold text-accent">
          +1
        </span>
      )}
    </span>
  );
}

const GROUP_W = 164;

function GroupNode({
  node,
  selected,
  collapsed,
}: {
  node: TreeNode;
  selected: boolean;
  collapsed: boolean;
}) {
  return (
    <span
      className={`flex flex-col items-center rounded-full border-2 bg-surface-2 px-4 py-1.5 transition hover:-translate-y-0.5 ${
        selected ? "border-accent ring-2 ring-accent/30" : "border-border"
      } ${
        // A folded group looks like a little stack of cards.
        collapsed
          ? "shadow-[0_4px_0_-1px_var(--surface-2),0_4px_0_0_var(--border),0_8px_0_-1px_var(--surface-2),0_8px_0_0_var(--border)]"
          : "shadow-sm"
      }`}
      style={{ width: GROUP_W }}
    >
      <span className="line-clamp-2 max-w-full text-center font-serif text-[15px] leading-tight font-semibold">
        {node.person.name}
      </span>
      <span className="text-[11px] whitespace-nowrap text-muted">
        <span className="font-semibold text-foreground">{node.size}</span>{" "}
        {node.size === 1 ? "guest" : "guests"}
        {node.unlikely ? ` · ${node.unlikely} unlikely` : ""}
      </span>
    </span>
  );
}

function PartnerNode({
  person,
  tree,
  side,
  selected,
}: {
  person: Person;
  tree: GuestTree;
  side: "left" | "right";
  selected: boolean;
}) {
  const family =
    tree.sections[side === "left" ? "leftFamily" : "rightFamily"].size;
  const friends =
    tree.sections[side === "left" ? "leftFriends" : "rightFriends"].size;
  return (
    <span
      className={`flex w-[168px] flex-col items-center gap-1 rounded-2xl border-2 bg-surface px-3 py-2.5 shadow-md transition hover:-translate-y-0.5 ${
        selected ? "border-accent ring-2 ring-accent/30" : "border-accent/60"
      }`}
    >
      <Avatar person={person} size={40} />
      <span className="max-w-full truncate font-serif text-lg leading-tight font-semibold">
        {person.name}
      </span>
      <span className="text-[11px] text-muted">
        {family} family · {friends} friends
      </span>
    </span>
  );
}

function HoverCard({
  hover,
  size,
  person,
  tree,
}: {
  hover: Hover;
  size: { w: number; h: number };
  person: Person;
  tree: GuestTree;
}) {
  const W = 300;
  const toRight = hover.right + 12 + W < size.w || hover.left - 12 - W < 0;
  const left = toRight
    ? Math.min(hover.right + 12, size.w - W - 8)
    : hover.left - 12 - W;
  const top = clamp(hover.top - 12, 8, Math.max(8, size.h - 320));
  return (
    <div
      className="animate-card-in pointer-events-none absolute z-20 rounded-xl border border-border bg-surface p-4 shadow-xl"
      style={{ left: Math.max(8, left), top, width: W }}
      role="tooltip"
    >
      <PersonDetails person={person} tree={tree} />
      <p className="mt-3 text-[11px] text-muted">Click to open the card</p>
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center border-b border-border text-muted last:border-b-0 hover:bg-surface-2 hover:text-foreground"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}

function Legend() {
  return (
    <div
      className="absolute bottom-3 left-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-border bg-surface/95 px-3 py-2 text-xs shadow-sm backdrop-blur"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {(["blood", "inlaw", "friend"] as Relation[]).map((r) => (
        <span key={r} className="inline-flex items-center gap-1.5">
          <TieGlyph relation={r} />
          {TIE_SHORT[r]}
        </span>
      ))}
      <span className="hidden h-3 w-px bg-border sm:block" />
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full ring-2 ring-rsvp-yes" />{" "}
        Attending
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full ring-2 ring-rsvp-pending" />{" "}
        Waiting
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full ring-2 ring-rsvp-no" /> Declined
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="flex size-4 items-center justify-center rounded-full border border-border bg-surface-2 text-[10px] font-bold text-muted">
          ?
        </span>
        Unlikely
      </span>
    </div>
  );
}
