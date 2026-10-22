import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { mediaUrl } from "@/lib/media";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

type Episode = { id: string; episode_number: number; title: string; duration_seconds: number | null; is_free: boolean; thumbnail_url: string | null };
export function EpisodeCarousel({ episodes, currentId, backdrop, to = "/watch/$episodeId" }: { episodes: Episode[]; currentId: string; backdrop: string | null; to?: "/watch/$episodeId" | "/account/watch/$episodeId" }) {
  const row = useRef<HTMLOListElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const update = () => setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    const active = el.querySelector<HTMLElement>('[aria-current="true"]')?.closest("li");
    if (active) el.scrollLeft = active.offsetLeft - el.offsetLeft;
    update();
    return () => { observer.disconnect(); el.removeEventListener("scroll", update); };
  }, [currentId, episodes]);
  const scroll = (dir: number) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.8, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  return <section aria-label="Episodes" className="min-w-0 border-t border-border pt-7">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-medium">Episodes <span className="ml-2 text-sm text-muted-foreground">{episodes.length}</span></h2>
      <div className="flex gap-2">
        <Button variant="secondary" size="icon" className="site-nav-action" aria-label="Scroll episodes left" title="Previous episodes" disabled={!edges.left} onClick={() => scroll(-1)}><ChevronLeft /></Button>
        <Button variant="secondary" size="icon" className="site-nav-action" aria-label="Scroll episodes right" title="More episodes" disabled={!edges.right} onClick={() => scroll(1)}><ChevronRight /></Button>
      </div>
    </div>
    <ol ref={row} className="no-scrollbar relative mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
      {episodes.map(ep => {
        const active = ep.id === currentId;
        const src = mediaUrl(ep.thumbnail_url ?? backdrop);
        return <li key={ep.id} className="w-[min(76vw,300px)] shrink-0 snap-start">
          <Link to={to} params={{ episodeId: ep.id }} aria-current={active ? "true" : undefined} draggable={false} className="episode-card group block rounded-md outline-offset-4 focus-visible:outline-primary">
            <div className="relative aspect-video overflow-hidden rounded-md bg-surface">
              {src ? <img src={src} alt={ep.title} loading="lazy" draggable={false} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" /> : <div className="flex size-full items-center justify-center"><Play className="size-8 text-muted-foreground" /></div>}
              <span className="absolute left-3 top-3 rounded-sm bg-scrim px-2 py-1 text-xs font-medium text-media-ink">{String(ep.episode_number).padStart(2, "0")}</span>
              <span className={cn("absolute bottom-3 left-3 rounded-sm px-2 py-1 text-xs font-medium", active ? "bg-primary text-primary-foreground" : "bg-scrim text-media-ink")}>{active ? "Now playing" : ep.is_free ? "Free" : formatDuration(ep.duration_seconds ?? 0)}</span>
              <span className={cn("absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity", active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")}><Play className="size-4 fill-current" /></span>
              {active ? <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" /> : null}
            </div>
            <h3 className={cn("mt-3 truncate text-base font-medium", active ? "text-primary" : "text-foreground")}>{ep.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Episode {ep.episode_number} · {formatDuration(ep.duration_seconds ?? 0)}</p>
          </Link>
        </li>;
      })}
    </ol>
  </section>;
}