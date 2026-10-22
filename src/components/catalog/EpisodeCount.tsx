import { Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function EpisodeCount({ count, className }: { count: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap font-medium", className)}>
      <Layers3 aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
      <span><span className="tabular-nums">{count}</span> {count === 1 ? "episode" : "episodes"}</span>
    </span>
  );
}