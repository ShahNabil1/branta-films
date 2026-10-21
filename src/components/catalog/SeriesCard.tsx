import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { mediaUrl } from "@/lib/media";
import { formatTaka } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  title: string;
  poster_url: string | null;
  genres: string[];
  price_bdt: number;
  release_year: number | null;
  hasFreeEpisode?: boolean;
  episodeCount?: number;
  tagline?: string | null;
  className?: string;
};

/** Poster card: lifts, scales and glows orange on hover, revealing a preview panel. */
export function SeriesCard({
  slug,
  title,
  poster_url,
  genres,
  price_bdt,
  release_year,
  hasFreeEpisode,
  episodeCount,
  tagline,
  className,
}: Props) {
  const src = mediaUrl(poster_url);
  return (
    <Link
      to="/series/$slug"
      params={{ slug }}
      className={cn("group/card block min-w-0 rounded-lg focus-visible:outline-offset-4", className)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-foreground/10 bg-surface shadow-[var(--shadow-card)] transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out-expo)] group-hover/card:-translate-y-1 group-hover/card:scale-[1.04] group-hover/card:border-primary/60 group-hover/card:shadow-glow">
        {src ? (
          <img
            src={src}
            alt={`${title} poster`}
            width={600}
            height={900}
            loading="lazy"
            className="size-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover/card:scale-110"
          />
        ) : (
          <div className="flex size-full items-end p-4 text-lg font-semibold">{title}</div>
        )}
        {hasFreeEpisode ? (
          <span className="text-caption absolute left-2 top-2 rounded-sm bg-primary px-2 py-1 font-medium text-primary-foreground">
            Free episode 1
          </span>
        ) : null}

        <div className="card-fade pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 p-3 opacity-0 transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] group-hover/card:translate-y-0 group-hover/card:opacity-100">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow-soft">
              <Play className="size-4 translate-x-px fill-current" />
            </span>
            <span className="text-sm font-semibold leading-tight text-media-ink">{hasFreeEpisode ? "Watch free" : "View series"}</span>
          </div>
          {tagline ? <p className="mt-2 line-clamp-2 text-xs leading-snug text-media-ink/80">{tagline}</p> : null}
          <p className="text-caption mt-2 text-media-ink/70">
            {[episodeCount ? `${episodeCount} ep` : null, ...genres.slice(0, 2)].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground transition-colors group-hover/card:text-primary">{title}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[release_year, ...genres.slice(0, 2)].filter(Boolean).join(" · ")}
          </p>
        </div>
        {price_bdt > 0 ? <span className="shrink-0 font-mono text-xs text-muted-foreground">{formatTaka(price_bdt)}</span> : null}
      </div>
    </Link>
  );
}
