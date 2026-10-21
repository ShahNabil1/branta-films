import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import { continueWatchingQuery } from "@/lib/progress";
import { formatClock } from "@/lib/format";
import { MediaRow } from "./MediaRow";

const item = "w-[17rem] shrink-0 snap-start sm:w-[20rem]";

export function ContinueWatching({ title = "Continue watching", emptyText }: { title?: string; emptyText?: string }) {
  const { user } = useAuth();
  const { data, isPending } = useQuery(continueWatchingQuery(user?.id));
  if (!user) return null;
  if (isPending) {
    return (
      <MediaRow title={title}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${item} aspect-video animate-pulse rounded-lg bg-surface`} />
        ))}
      </MediaRow>
    );
  }
  if (!data?.length) {
    return emptyText ? (
      <section aria-label={title}>
        <h2 className="text-h3 font-semibold">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      </section>
    ) : null;
  }
  return (
    <MediaRow title={title}>
      {data.map((row) => {
        const pct = row.duration_seconds ? Math.min(100, (row.position_seconds / row.duration_seconds) * 100) : 0;
        const img = mediaUrl(row.series?.backdrop_url ?? row.series?.poster_url);
        return (
          <Link
            key={row.episode_id}
            to="/watch/$episodeId"
            params={{ episodeId: row.episode_id }}
            className={`${item} group/cw block overflow-hidden rounded-lg glass transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:scale-[1.03] hover:border-primary/60 hover:shadow-glow`}
          >
            <div className="relative aspect-video overflow-hidden">
              {img ? (
                <img src={img} alt="" loading="lazy" width={1600} height={900} className="size-full object-cover transition-transform duration-[1200ms] group-hover/cw:scale-110" />
              ) : null}
              <div className="card-fade absolute inset-0 opacity-60" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid size-12 scale-90 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-glow-soft transition-[opacity,transform] duration-300 group-hover/cw:scale-100 group-hover/cw:opacity-100">
                  <Play className="size-5 translate-x-px fill-current" />
                </span>
              </span>
              <span className="absolute bottom-2 right-2 rounded-full bg-scrim px-2 py-0.5 font-mono text-[10px] text-media-ink">{formatClock(row.position_seconds)}</span>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-foreground/20">
                <div className="h-full bg-primary shadow-glow-soft" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-medium">{row.series?.title}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                E{row.episode?.episode_number} · {row.episode?.title}
              </p>
            </div>
          </Link>
        );
      })}
    </MediaRow>
  );
}
