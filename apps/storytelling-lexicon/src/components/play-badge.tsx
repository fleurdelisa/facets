import { PLAY_INFO, type PlayType } from "@/lib/types";

export function PlayBadge({ play }: { play: PlayType }) {
  return (
    <span
      title={PLAY_INFO[play].definition}
      className={`inline-block rounded-full px-2 py-0.5 text-xs ${
        play === "straight" ? "bg-rule text-muted" : "bg-accent-soft text-accent"
      }`}
    >
      {PLAY_INFO[play].label}
    </span>
  );
}
