"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface WordWheelProps {
  items: string[];
  selected: string;
  onSelect: (word: string) => void;
}

const RADIUS = 150; // px, radius of the virtual drum
const STEP = (17 * Math.PI) / 180; // angle between neighbouring items
const VISIBLE = 5; // items rendered on each side of the selection
const ITEM_PX = 2 * RADIUS * Math.sin(STEP / 2); // arc length between items
const WHEEL_THRESHOLD = 60; // accumulated wheel delta per item

export default function WordWheel({ items, selected, onSelect }: WordWheelProps) {
  const index = Math.max(0, items.indexOf(selected));
  const [pos, setPos] = useState(index);
  const posRef = useRef(index);
  const targetRef = useRef(index);
  const dragRef = useRef<{ y: number; start: number; moved: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const wheelAcc = useRef(0);

  const frameRef = useRef(0);

  // Spring the drum toward `target`.
  const animateTo = useCallback((target: number) => {
    targetRef.current = target;
    cancelAnimationFrame(frameRef.current);
    const tick = () => {
      const diff = targetRef.current - posRef.current;
      if (Math.abs(diff) < 0.002) {
        posRef.current = targetRef.current;
        setPos(posRef.current);
        return;
      }
      posRef.current += diff * 0.2;
      setPos(posRef.current);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!dragRef.current) animateTo(index);
  }, [index, items, animateTo]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const step = useCallback(
    (delta: number) => {
      const next = Math.min(items.length - 1, Math.max(0, index + delta));
      if (next !== index) onSelect(items[next]);
    },
    [index, items, onSelect],
  );

  // Native non-passive listener so the page doesn't scroll under the wheel.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelAcc.current += e.deltaY;
      if (Math.abs(wheelAcc.current) >= WHEEL_THRESHOLD) {
        step(Math.sign(wheelAcc.current));
        wheelAcc.current = 0;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [step]);

  const onPointerDown = (e: React.PointerEvent) => {
    cancelAnimationFrame(frameRef.current);
    dragRef.current = { y: e.clientY, start: posRef.current, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dy = drag.y - e.clientY;
    if (!drag.moved && Math.abs(dy) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    const p = Math.min(items.length - 1, Math.max(0, drag.start + dy / ITEM_PX));
    posRef.current = p;
    setPos(p);
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.moved) return;
    const next = Math.round(posRef.current);
    if (items[next] && next !== index) onSelect(items[next]);
    else animateTo(index);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      PageUp: -5,
      PageDown: 5,
      Home: -items.length,
      End: items.length,
    };
    if (e.key in keys) {
      e.preventDefault();
      step(keys[e.key]);
    }
  };

  const first = Math.max(0, Math.floor(pos) - VISIBLE);
  const last = Math.min(items.length - 1, Math.ceil(pos) + VISIBLE);
  const rendered = [];
  for (let i = first; i <= last; i++) {
    const d = i - pos;
    const theta = d * STEP;
    if (Math.abs(theta) > Math.PI / 2) continue;
    const dist = Math.abs(d);
    const isSelected = i === index;
    rendered.push(
      <li
        key={items[i]}
        role="option"
        aria-selected={isSelected}
        onClick={() => !isSelected && onSelect(items[i])}
        className="absolute inset-x-0 top-1/2 flex h-10 -mt-5 cursor-pointer items-center justify-center font-serif select-none"
        style={{
          transform: `translateY(${RADIUS * Math.sin(theta)}px) translateZ(${
            RADIUS * (Math.cos(theta) - 1)
          }px) rotateX(${-theta}rad)`,
          fontWeight: Math.round(Math.max(200, 800 - dist * 140)),
          fontSize: `${20 + 10 * Math.max(0, 1 - dist)}px`,
          opacity: Math.max(0.08, 1 - dist * 0.17),
          color: isSelected ? "var(--ink)" : "var(--ink-soft)",
          letterSpacing: isSelected ? "-0.01em" : "0",
        }}
      >
        {items[i]}
      </li>,
    );
  }

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="listbox"
      aria-label="Words"
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="wheel relative h-full min-h-[220px] touch-none overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      style={{ perspective: "900px" }}
    >
      {/* Lens marking the selected row */}
      <div className="pointer-events-none absolute inset-x-4 top-1/2 h-12 -mt-6 rounded-xl border border-[var(--line)] bg-[var(--paper-raised)]" />
      <ul className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {rendered}
      </ul>
    </div>
  );
}
