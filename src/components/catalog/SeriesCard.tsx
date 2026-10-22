import { Link } from "@tanstack/react-router";
import { mediaUrl } from "@/lib/media";
import { formatTaka } from "@/lib/format";
import { seriesPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  title: string;
  poster_url: string | null;
  genres: string[];
  price_bdt: number;
  discount_price_bdt?: number | null;
  release_year: number | null;
  hasFreeEpisode?: boolean;
  episodeCount?: number;
  tagline?: string | null;
  className?: string;
  /** Dashboard pages pass "/account/series/$slug" so viewers stay inside their account. */
  to?: "/series/$slug" | "/account/series/$slug";
};

/** Branta Tech portfolio-style card: calm frame, slow image zoom, label + title + arrow on hover. */
export function SeriesCard({
  slug,
  title,
  poster_url,
  genres,
  price_bdt,
  discount_price_bdt,
  release_year,
  hasFreeEpisode,
  episodeCount,
  className,
  to = "/series/$slug",
}: Props) {
  const src = mediaUrl(poster_url);
  return (
    <Link
      to={to}
      params={{ slug }}
      draggable={false}
      className={cn("group block min-w-0 rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary", className)}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[4px] bg-muted">
        {src ? (
          <img
            src={src}
            alt={`${title} poster`}
            width={600}
            height={900}
            loading="lazy"
            draggable={false}
            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex size-full items-end p-4 text-body font-medium">{title}</div>
        )}
        {hasFreeEpisode ? (
          <span className="text-caption pointer-events-none absolute bottom-3 left-3 rounded-[3px] bg-scrim px-2 py-1 font-medium text-media-ink backdrop-blur-sm">
            Episode 1 free
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption flex h-4 items-center gap-2 truncate uppercase tracking-wide text-muted-foreground">
            {genres[0] ? (
              <>
                <span aria-hidden className="size-1 shrink-0 rounded-full bg-primary" />
                <span className="truncate">{genres.slice(0, 2).join(" · ")}</span>
              </>
            ) : null}
          </p>
          <h3 className="text-body mt-1 truncate font-medium text-foreground/85 transition-colors duration-300 group-hover:text-foreground">
            {title}
          </h3>
          <p className="text-caption mt-0.5 truncate text-muted-foreground">
            {[release_year, episodeCount ? `${episodeCount} episodes` : null, price_bdt > 0 ? formatTaka(seriesPrice(price_bdt, discount_price_bdt).final) : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span aria-hidden className="mt-5 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:opacity-100">
          →
        </span>
      </div>
    </Link>
  );
}
