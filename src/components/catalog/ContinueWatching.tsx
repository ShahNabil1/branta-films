import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import { continueWatchingQuery } from "@/lib/progress";
import { formatClock } from "@/lib/format";
import { MediaRow } from "./MediaRow";

const item = "w-[17rem] shrink-0 snap-start sm:w-[20rem]";

export function ContinueWatching({ title = "Continue watching", emptyText, inDashboard = false }: { title?: string; emptyText?: string; inDashboard?: boolean }) {
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
            to={inDashboard ? "/account/watch/$episodeId" : "/watch/$episodeId"}
            params={{ episodeId: row.episode_id }}
            className={`${item} group block rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary`}
          >
            <div className="relative aspect-video overflow-hidden rounded-[4px] bg-muted">
              {img ? (
                <img src={img} alt="" loading="lazy" width={1600} height={900} className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
              ) : null}
              <span className="text-caption pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-[3px] bg-scrim px-2 py-1 font-medium text-media-ink backdrop-blur-sm">
                <Play className="size-3 fill-current" /> Resume at {formatClock(row.position_seconds)}
              </span>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-media-ink/25">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-body truncate font-medium text-foreground/85 transition-colors duration-300 group-hover:text-foreground">{row.series?.title}</p>
                <p className="text-caption mt-0.5 truncate text-muted-foreground">
                  Episode {row.episode?.episode_number} · {row.episode?.title}
                </p>
              </div>
              <span aria-hidden className="mt-1 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">→</span>
            </div>
          </Link>
        );
      })}
    </MediaRow>
  );
}
