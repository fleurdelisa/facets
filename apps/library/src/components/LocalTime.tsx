"use client";

import { useEffect, useState } from "react";

/** Renders an ISO timestamp in the viewer's own time zone. */
export function LocalTime({ iso, withTime = false }: { iso: string; withTime?: boolean }) {
  const format = (tz?: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      ...(withTime ? { timeStyle: "short" } : {}),
      timeZone: tz,
    });
  const [label, setLabel] = useState(() => format("UTC"));
  useEffect(() => setLabel(format()), [iso]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <time dateTime={iso} title={new Date(iso).toISOString()}>
      {label}
    </time>
  );
}
