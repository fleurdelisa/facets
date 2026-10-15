"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useEditMode, useTreeStore } from "@/lib/store";
import {
  durationLabel,
  formatPeriod,
  layoutTree,
  ratingArcPath,
  statusLabel,
  type Layout,
  type TreeEdge,
  type TreeNode,
} from "@/lib/tree";
import type { Skill } from "@/lib/types";
import DetailPanel from "./DetailPanel";
import { SelfForm, SkillForm } from "./EditForms";
import ThemeToggle from "./ThemeToggle";

type View = { x: number; y: number; k: number };
export type Modal =
  | { kind: "skill"; skill?: Skill; branchId?: string; parentId?: string | null }
  | { kind: "self" }
  | null;

const MIN_K = 0.25;
const MAX_K = 3;
const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));

function colorVars(node: TreeNode | TreeEdge["to"], f: number): CSSProperties {
  const c = node.colors;
  return {
    "--cl": c.light,
    "--cd": c.dark,
    "--cl-full": c.lightFull,
    "--cd-full": c.darkFull,
    "--el": c.lightEdge,
    "--ed": c.darkEdge,
    "--f": f.toFixed(3),
  } as CSSProperties;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export default function SkillTree() {
  const store = useTreeStore();
  const editable = useEditMode();
  const reducedMotion = useReducedMotion();
  const [now] = useState(() => new Date());
  const layout: Layout = useMemo(() => layoutTree(store.data, now), [store.data, now]);
  const nodeById = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const fitted = useRef(false);

  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selfHover, setSelfHover] = useState(false);
  const [modal, setModal] = useState<Modal>(null);

  /* ------------------------------------------------------------ sizing */

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep the self orb centered and scale so the widest branch fits.
  const fit = useCallback(() => {
    if (!size) return;
    const { minX, minY, maxX, maxY } = layout.bounds;
    const halfW = Math.max(-minX, maxX);
    const halfH = Math.max(-minY, maxY);
    const pad = size.w < 640 ? 12 : 40;
    const top = size.w < 640 ? 70 : 80;
    const availW = size.w - pad * 2;
    const availH = size.h - top - pad;
    const centered = Math.min(availW / (2 * halfW), availH / (2 * halfH));
    const snug = Math.min(availW / (maxX - minX), availH / (maxY - minY));
    // Prefer the self orb dead-center unless that makes the tree much smaller (lopsided trees, phones).
    if (centered >= snug * 0.8) {
      const k = clampK(Math.min(centered, 1.25));
      setView({ k, x: size.w / 2, y: top + availH / 2 });
    } else {
      const k = clampK(Math.min(snug, 1.25));
      setView({ k, x: size.w / 2 - ((minX + maxX) / 2) * k, y: top + availH / 2 - ((minY + maxY) / 2) * k });
    }
  }, [layout.bounds, size]);

  useEffect(() => {
    if (size && store.loaded && !fitted.current) {
      fitted.current = true;
      fit();
    }
  }, [size, store.loaded, fit]);

  /* ---------------------------------------------------------- pan/zoom */

  const zoomAt = useCallback((px: number, py: number, factor: number) => {
    setView((v) => {
      const k = clampK(v.k * factor);
      const ratio = k / v.k;
      return { k, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio };
    });
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0015)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(0);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (pointers.current.size === 0) moved.current = 0;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const rect = svgRef.current!.getBoundingClientRect();

    const onMove = (ev: PointerEvent) => {
      const prev = pointers.current.get(ev.pointerId);
      if (!prev) return;
      const pts = [...pointers.current.entries()];
      if (pts.length === 1) {
        const dx = ev.clientX - prev.x;
        const dy = ev.clientY - prev.y;
        moved.current += Math.abs(dx) + Math.abs(dy);
        if (moved.current > 4) setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      } else if (pts.length >= 2) {
        const other = pts.find(([id]) => id !== ev.pointerId)![1];
        const before = Math.hypot(prev.x - other.x, prev.y - other.y) || 1;
        const after = Math.hypot(ev.clientX - other.x, ev.clientY - other.y) || 1;
        const midX = (ev.clientX + other.x) / 2 - rect.left;
        const midY = (ev.clientY + other.y) / 2 - rect.top;
        moved.current += 10;
        setView((v) => {
          const k = clampK(v.k * (after / before));
          const ratio = k / v.k;
          const dx = (ev.clientX - prev.x) / 2;
          const dy = (ev.clientY - prev.y) / 2;
          return { k, x: midX - (midX - v.x) * ratio + dx, y: midY - (midY - v.y) * ratio + dy };
        });
      }
      pointers.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    };
    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      pointers.current.delete(ev.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const wasDrag = () => moved.current > 6;

  /* ------------------------------------------------------- interaction */

  const select = (id: string | null) => {
    if (wasDrag()) return;
    setSelectedId(id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (modal) setModal(null);
      else setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  // Drop selection if the selected node was deleted.
  useEffect(() => {
    if (selectedId && !nodeById.has(selectedId)) setSelectedId(null);
  }, [nodeById, selectedId]);

  const hovered = hoverId ? nodeById.get(hoverId) : undefined;
  const selected = selectedId ? nodeById.get(selectedId) : undefined;
  const arcNode = hovered ?? selected;
  // Tooltip sits beside the node (so it never covers the rating arcs), flipping left near the right edge.
  const tipFlip =
    !!hovered && !!size && view.x + (hovered.x + hovered.r + 16) * view.k + 260 > size.w - (selected ? 380 : 0);

  const nodeProps = (n: TreeNode) => ({
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") setHoverId(n.id);
    },
    onPointerLeave: () => setHoverId((h) => (h === n.id ? null : h)),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      select(selectedId === n.id ? null : n.id);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSelectedId(n.id);
      }
    },
    tabIndex: 0,
    role: "button" as const,
  });

  const openAdd = (defaults: { branchId?: string; parentId?: string | null } = {}) =>
    setModal({ kind: "skill", ...defaults });

  /* ------------------------------------------------------------ render */

  const self = layout.nodes[0];
  const others = layout.nodes.slice(1);
  const ready = store.loaded && !!size;

  return (
    <div className="st-root">
      <header className="st-header">
        <div className="st-title">
          <span className="st-kicker">Facets</span>
          <h1>{store.data.self.name}</h1>
          <p>{store.data.self.title}</p>
        </div>
        <div className="st-toolbar">
          {editable && (
            <div className="st-edit-tools">
              <span className="st-badge" title="Edits are saved in this browser until exported">
                Editing{store.dirty ? " · unsaved" : ""}
              </span>
              <button type="button" className="st-btn" onClick={() => openAdd()}>
                + Skill
              </button>
              <button type="button" className="st-btn" onClick={store.exportJson} title="Download tree.json">
                Export
              </button>
              {store.dirty && (
                <button
                  type="button"
                  className="st-btn"
                  onClick={() => {
                    if (confirm("Discard local edits and restore the published tree?")) store.reset();
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div ref={wrapRef} className="st-stage">
        <svg
          ref={svgRef}
          className={`st-svg ${ready ? "is-ready" : ""}`}
          width={size?.w ?? 0}
          height={size?.h ?? 0}
          onPointerDown={onPointerDown}
          onClick={() => select(null)}
          aria-label="Skill tree"
        >
          <defs>
            <radialGradient id="st-self-light" cx="40%" cy="35%" r="75%">
              <stop offset="0%" stopColor="#fffaf0" />
              <stop offset="60%" stopColor="#efdcb3" />
              <stop offset="100%" stopColor="#c9a467" />
            </radialGradient>
            <radialGradient id="st-self-dark" cx="50%" cy="45%" r="70%">
              <stop offset="0%" stopColor="#1b2140" />
              <stop offset="70%" stopColor="#0b0e1c" />
              <stop offset="100%" stopColor="#05060b" />
            </radialGradient>
          </defs>

          {ready && (
            <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
              {/* decorative rings */}
              <g className="st-rings" aria-hidden>
                {layout.rings.map((r, i) => (
                  <circle key={r} r={r} className={`st-ring ${i === 0 ? "st-ring-inner" : ""}`} />
                ))}
                <g>
                  {!reducedMotion && (
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0"
                      to="360"
                      dur="360s"
                      repeatCount="indefinite"
                    />
                  )}
                  {Array.from({ length: 72 }, (_, i) => {
                    const a = (i * Math.PI) / 36;
                    const r0 = layout.rings[layout.rings.length - 1] + 70;
                    const len = i % 6 === 0 ? 14 : 6;
                    return (
                      <line
                        key={i}
                        className="st-tick"
                        x1={Math.cos(a) * r0}
                        y1={Math.sin(a) * r0}
                        x2={Math.cos(a) * (r0 + len)}
                        y2={Math.sin(a) * (r0 + len)}
                      />
                    );
                  })}
                  <circle r={layout.rings[layout.rings.length - 1] + 70} className="st-ring st-ring-outer" />
                </g>
              </g>

              {/* edges */}
              <g className="st-edges">
                {layout.edges.map((e, i) => {
                  const w = 1 + 5 * e.freshness + (e.from.kind === "self" ? 1 : 0);
                  const active = arcNode && (arcNode.id === e.to.id || arcNode.id === e.from.id);
                  return (
                    <g
                      key={e.id}
                      className={`st-edge ${active ? "is-active" : ""}`}
                      style={{ ...colorVars(e.to, e.freshness), animationDelay: `${i * 40}ms` }}
                    >
                      <line className="st-ana st-ana-r" x1={e.from.x - 3} y1={e.from.y - 1} x2={e.to.x - 3} y2={e.to.y - 1} strokeWidth={w} />
                      <line className="st-ana st-ana-b" x1={e.from.x + 3} y1={e.from.y + 1} x2={e.to.x + 3} y2={e.to.y + 1} strokeWidth={w} />
                      <line
                        className="st-edge-main"
                        x1={e.from.x}
                        y1={e.from.y}
                        x2={e.to.x}
                        y2={e.to.y}
                        strokeWidth={w}
                        pathLength={1}
                        style={{ animationDelay: `${150 + i * 45}ms` }}
                      />
                    </g>
                  );
                })}
              </g>

              {/* branch + skill nodes */}
              <g className="st-nodes">
                {others.map((n, i) => {
                  const label = n.kind === "branch" ? n.branch.name : n.kind === "skill" ? n.skill.name : "";
                  const glyph =
                    n.kind === "branch" ? (n.branch.glyph ?? n.branch.name[0]) : n.kind === "skill" ? (n.skill.glyph ?? "") : "";
                  const small = glyph.length >= 3;
                  return (
                    <g
                      key={n.id}
                      className={`st-node st-${n.kind} ${selectedId === n.id ? "is-selected" : ""} ${hoverId === n.id ? "is-hover" : ""}`}
                      transform={`translate(${n.x} ${n.y})`}
                      style={colorVars(n, n.freshness)}
                      aria-label={
                        n.kind === "skill" ? `${label}, rated ${n.skill.rating} of 5, ${statusLabel(n.skill, now)}` : `${label} branch`
                      }
                      {...nodeProps(n)}
                    >
                      <g className="st-pop" style={{ animationDelay: `${200 + i * 55}ms` }}>
                        <circle r={n.r + 9} className="st-hit" />
                        <circle r={n.r + 5} className="st-halo" />
                        <circle r={n.r} className="st-ana st-ana-r" cx={-2.5} />
                        <circle r={n.r} className="st-ana st-ana-b" cx={2.5} />
                        <circle r={n.r} className="st-body" />
                        <circle r={n.r - 4} className="st-inner" />
                        <text className={`st-glyph ${small ? "is-small" : ""}`} dy="0.35em">
                          {glyph}
                        </text>
                        <text className={`st-label ${n.kind === "branch" ? "st-label-branch" : ""}`} y={n.r + 20}>
                          {label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* self orb */}
              <g
                className={`st-self ${selectedId === "self" ? "is-selected" : ""}`}
                onPointerEnter={() => setSelfHover(true)}
                onPointerLeave={() => setSelfHover(false)}
              >
                <circle r={self.r + 22} className="st-hit" />
                <g className="st-self-orb" {...nodeProps(self)} aria-label={`${store.data.self.name}, about`}>
                  <circle r={self.r + 16} className="st-self-ring" />
                  <circle r={self.r + 9} className="st-self-ring2" />
                  <circle r={self.r} className="st-ana st-ana-r" cx={-3} />
                  <circle r={self.r} className="st-ana st-ana-b" cx={3} />
                  <circle r={self.r} className="st-self-body" />
                  <text className="st-self-glyph" dy="0.35em">
                    {store.data.self.glyph}
                  </text>
                </g>
                {editable && (
                  <g
                    className={`st-plus ${selfHover ? "is-on" : ""}`}
                    transform={`translate(${self.r * 0.74} ${-self.r * 0.74})`}
                    role="button"
                    tabIndex={0}
                    aria-label="Add a skill"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!wasDrag()) openAdd();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openAdd();
                      }
                    }}
                  >
                    <title>Add a skill</title>
                    <g className="st-plus-inner">
                      <circle r={16} />
                      <path d="M -6.5 0 H 6.5 M 0 -6.5 V 6.5" />
                    </g>
                  </g>
                )}
              </g>

              {/* rating arcs for the active skill */}
              {arcNode?.kind === "skill" && (
                <g
                  key={arcNode.id}
                  className="st-arcs"
                  transform={`translate(${arcNode.x} ${arcNode.y})`}
                  style={colorVars(arcNode, arcNode.freshness)}
                  aria-hidden
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <path
                      key={i}
                      d={ratingArcPath(arcNode.r + 13, i)}
                      className={`st-arc ${i < arcNode.skill.rating ? "is-filled" : ""}`}
                      style={{ animationDelay: `${i * 45}ms` }}
                    />
                  ))}
                </g>
              )}
            </g>
          )}
        </svg>

        {/* hover tooltip */}
        {ready && hovered && hovered.kind !== "self" && (
          <div
            className={`st-tooltip ${tipFlip ? "is-left" : ""}`}
            style={{
              left: view.x + (hovered.x + (tipFlip ? -1 : 1) * (hovered.r + 16)) * view.k,
              top: view.y + hovered.y * view.k,
            }}
          >
            {hovered.kind === "skill" ? (
              <>
                <strong>{hovered.skill.name}</strong>
                <span className="st-tooltip-meta">
                  {formatPeriod(hovered.skill)} · {durationLabel(hovered.skill, now)}
                </span>
                <span className="st-tooltip-meta">{statusLabel(hovered.skill, now)}</span>
                {hovered.skill.note && <span className="st-tooltip-note">{hovered.skill.note}</span>}
              </>
            ) : (
              <>
                <strong>{hovered.branch.name}</strong>
                <span className="st-tooltip-meta">
                  {store.data.skills.filter((s) => s.branchId === hovered.branch.id).length} skills
                </span>
              </>
            )}
          </div>
        )}

        <div className="st-controls" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" className="st-btn st-icon-btn" aria-label="Zoom in" onClick={() => size && zoomAt(size.w / 2, size.h / 2, 1.25)}>
            +
          </button>
          <button type="button" className="st-btn st-icon-btn" aria-label="Zoom out" onClick={() => size && zoomAt(size.w / 2, size.h / 2, 0.8)}>
            −
          </button>
          <button type="button" className="st-btn st-icon-btn" aria-label="Fit to screen" onClick={fit}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <aside className="st-legend" aria-label="Legend">
          <div className="st-legend-row">
            <svg width="44" height="14" aria-hidden>
              <line x1="2" y1="7" x2="42" y2="7" className="st-legend-fresh" />
            </svg>
            <span>Recent</span>
            <svg width="44" height="14" aria-hidden>
              <line x1="2" y1="7" x2="42" y2="7" className="st-legend-stale" />
            </svg>
            <span>Dormant</span>
          </div>
          <div className="st-legend-row">
            <svg width="44" height="18" viewBox="-22 -16 44 18" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <path key={i} d={ratingArcPath(14, i)} className={`st-legend-arc ${i < 3 ? "is-filled" : ""}`} />
              ))}
            </svg>
            <span>Self-rating, on hover</span>
          </div>
        </aside>
      </div>

      {selected && (
        <DetailPanel
          node={selected}
          data={store.data}
          now={now}
          editable={editable}
          onClose={() => setSelectedId(null)}
          onSelect={setSelectedId}
          onEdit={(skill) => setModal({ kind: "skill", skill })}
          onEditSelf={() => setModal({ kind: "self" })}
          onAdd={openAdd}
          onDelete={(id) => {
            store.deleteSkill(id);
            setSelectedId(null);
          }}
          onDeleteBranch={(id) => {
            store.deleteBranch(id);
            setSelectedId(null);
          }}
        />
      )}

      {modal?.kind === "skill" && (
        <SkillForm
          data={store.data}
          initial={modal.skill}
          defaults={{ branchId: modal.branchId, parentId: modal.parentId }}
          onCancel={() => setModal(null)}
          onAddBranch={store.addBranch}
          onSave={(skill) => {
            store.saveSkill(skill);
            setModal(null);
            setSelectedId(skill.id);
          }}
        />
      )}
      {modal?.kind === "self" && (
        <SelfForm
          initial={store.data.self}
          onCancel={() => setModal(null)}
          onSave={(self) => {
            store.saveSelf(self);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
