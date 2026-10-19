import Link from "next/link";
import { LAYER_INFO, type Layer } from "@/lib/types";

export function LayerBadge({ layer, link = false }: { layer: Layer; link?: boolean }) {
  const content = (
    <span data-layer={layer} className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-layer">
      <span className="bg-layer size-1.5 rounded-full" />
      {LAYER_INFO[layer].label}
    </span>
  );
  return link ? <Link href={`/browse/${layer === "beat" ? "structure" : layer}`}>{content}</Link> : content;
}
