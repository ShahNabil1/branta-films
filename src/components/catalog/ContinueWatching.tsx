import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import { continueWatchingQuery } from "@/lib/progress";
import { formatClock } from "@/lib/format";

export function ContinueWatching({ title = "Continue watching", emptyText }: { title?: string; emptyText?: string }) {
  const { user } = useAuth();
  const { data, isPending } = useQuery(continueWatchingQuery(user?.id));
  if (!user) return null;
  if (isPending) {
    return (
      <section aria-label={title}>
        <h2 className="text-h3">{title}</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-video animate-pulse rounded-md bg-surface" />
          ))}
        </div>
      </section>
    );
  }
  if (!data?.length) {
    return emptyText ? (
      <section aria-label={title}>
        <h2 className="text-h3">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      </section>
    ) : null;
  }
  return (
    <section aria-label={title}>
      <h2 className="text-h3">{title}</h2>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((item) => {
          const pct = item.duration_seconds ? Math.min(100, (item.position_seconds / item.duration_seconds) * 100) : 0;
          const img = mediaUrl(item.series?.backdrop_url ?? item.series?.poster_url);
          return (
            <Link
              key={item.episode_id}
              to="/watch/$episodeId"
              params={{ episodeId: item.episode_id }}
              className="group block overflow-hidden rounded-md border border-border bg-surface"
            >
              <div className="relative aspect-video overflow-hidden">
                {img ? <img src={img} alt="" loading="lazy" width={1600} height={900} className="size-full object-cover opacity-80 transition-opacity group-hover:opacity-100" /> : null}
                <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Play className="size-5 fill-current" />
                  </span>
                </span>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-foreground/20">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium">{item.series?.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  E{item.episode?.episode_number} · {item.episode?.title} · <span className="font-mono">{formatClock(item.position_seconds)}</span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
