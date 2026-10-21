import { Link } from "@tanstack/react-router";
import { mediaUrl } from "@/lib/media";
import { formatTaka } from "@/lib/format";

type Props = {
  slug: string;
  title: string;
  poster_url: string | null;
  genres: string[];
  price_bdt: number;
  release_year: number | null;
  hasFreeEpisode?: boolean;
};

export function SeriesCard({ slug, title, poster_url, genres, price_bdt, release_year, hasFreeEpisode }: Props) {
  const src = mediaUrl(poster_url);
  return (
    <Link to="/series/$slug" params={{ slug }} className="group block min-w-0 rounded-md focus-visible:outline-offset-4">
      <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-border bg-surface">
        {src ? (
          <img
            src={src}
            alt={`${title} poster`}
            width={600}
            height={900}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          />
        ) : null}
        {hasFreeEpisode ? (
          <span className="absolute left-2 top-2 rounded-sm bg-primary px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary-foreground">
            Free ep 1
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">{title}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[release_year, ...genres.slice(0, 2)].filter(Boolean).join(" · ")}
          </p>
        </div>
        {price_bdt > 0 ? <span className="shrink-0 font-mono text-xs text-muted-foreground">{formatTaka(price_bdt)}</span> : null}
      </div>
    </Link>
  );
}
