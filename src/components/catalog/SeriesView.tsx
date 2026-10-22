import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Clock, Lock, Play, ShoppingCart } from "lucide-react";
import { PriceTag } from "@/components/catalog/PriceTag";
import { PurchaseDialog } from "@/components/commerce/PurchaseDialog";
import { RichText } from "@/components/content/RichText";
import { SeriesCard } from "@/components/catalog/SeriesCard";
import { MediaRow, posterItem } from "@/components/catalog/MediaRow";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useOwnership } from "@/lib/ownership";
import { mediaUrl } from "@/lib/media";
import { catalogQuery, seriesQuery } from "@/lib/queries";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Shared series detail. `inDashboard` keeps every watch and series link inside the viewer dashboard. */
export function SeriesView({ slug, inDashboard = false }: { slug: string; inDashboard?: boolean }) {
  const watchTo = inDashboard ? "/account/watch/$episodeId" : "/watch/$episodeId";
  const seriesTo = inDashboard ? "/account/series/$slug" : "/series/$slug";
  const { data: series } = useSuspenseQuery(seriesQuery(slug));
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const { user, isStaff } = useAuth();
  const { data: own } = useOwnership(series?.id, series?.episodes.map((e) => e.id) ?? []);
  const [buying, setBuying] = useState<{ episodeId: string | null } | null>(null);
  if (!series) return null;

  const hasAccess = Boolean(own?.series) || isStaff;
  const episodeOpen = (id: string) => hasAccess || Boolean(own?.episodes.has(id));
  const buyable = series.episodes.filter((e) => !e.is_free && !episodeOpen(e.id) && !own?.pendingEpisodes.has(e.id))
    .map((e) => ({ id: e.id, episode_number: e.episode_number, title: e.title, price_bdt: e.price_bdt, image: e.thumbnail_url ?? series.backdrop_url }));
  const startBuy = (episodeId: string | null) => {
    if (!user) { window.location.assign(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`); return; }
    setBuying({ episodeId });
  };
  const backdrop = mediaUrl(series.backdrop_url);
  const poster = mediaUrl(series.poster_url);
  const first = series.episodes.find((e) => e.is_free || episodeOpen(e.id)) ?? series.episodes[0];
  const totalSeconds = series.episodes.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);
  const more = catalog
    .filter((s) => s.id !== series.id)
    .sort((a, b) => sharedGenres(b.genres, series.genres) - sharedGenres(a.genres, series.genres));

  const wrap = inDashboard ? "" : "mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)]";

  return (
    <div className={inDashboard ? "flex flex-col gap-8" : undefined}>
      <section
        className={cn(
          "relative isolate flex items-end overflow-hidden",
          inDashboard ? "player-theme min-h-[420px] rounded-md bg-background text-foreground" : "min-h-[min(86svh,820px)]",
        )}
      >
        <div className="absolute inset-0 -z-20 overflow-hidden" aria-hidden="true">
          {backdrop ? <img src={backdrop} alt="" width={1920} height={1080} fetchPriority="high" className="animate-ken-burns size-full object-cover" /> : null}
        </div>
        <div className="cinema-mask absolute inset-0 -z-10" />
        <div
          className={cn(
            "grid w-full gap-10 md:items-end",
            inDashboard ? "p-6 pt-24 sm:p-8 sm:pt-28 md:grid-cols-[200px_1fr]" : "mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] pb-14 pt-32 md:grid-cols-[260px_1fr]",
          )}
        >
          {poster ? (
            <img
              src={poster}
              alt={`${series.title} poster`}
              width={600}
              height={900}
              className={cn("animate-fade-up hidden aspect-[2/3] rounded-[4px] object-cover md:block", inDashboard ? "w-[200px]" : "w-[260px]")}
            />
          ) : null}
          <div className="max-w-3xl">
            <p className="animate-fade-up text-eyebrow flex items-center gap-2 text-foreground/75">
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              Branta Original · {series.genres.join(" / ")}
            </p>
            <h1 className={cn("animate-fade-up text-cinema-shadow mt-6 [animation-delay:60ms]", inDashboard ? "text-h1 font-semibold" : "text-hero")}>
              {series.title}
              <span className="text-primary">.</span>
            </h1>
            {series.tagline ? <p className="animate-fade-up text-cinema-shadow text-body-lg mt-6 max-w-2xl text-foreground/85 [animation-delay:120ms]">{series.tagline}</p> : null}
            <div className="animate-fade-up mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-small text-foreground/75 [animation-delay:160ms]">
              {series.maturity_rating ? <span className="rounded-full border border-foreground/30 px-2 py-0.5">{series.maturity_rating}</span> : null}
              {series.release_year ? <span>{series.release_year}</span> : null}
              <span>{series.episodes.length} episodes</span>
              {totalSeconds ? <span>{formatDuration(totalSeconds)} total</span> : null}
            </div>
            <div className="animate-fade-up mt-8 flex flex-wrap items-start gap-3 [animation-delay:220ms]">
              {first ? (
                <Button asChild size={inDashboard ? "lg" : "xl"}>
                  <Link to={watchTo} params={{ episodeId: first.id }}>
                    <Play className="fill-current" /> {first.is_free && !episodeOpen(first.id) ? `Watch episode ${first.episode_number} free` : "Watch now"}
                  </Link>
                </Button>
              ) : null}
              {series.price_bdt > 0 ? (
                hasAccess ? (
                  <span className={cn("text-small inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-6 font-medium text-success", inDashboard ? "h-12" : "h-14")}>
                    <CheckCircle2 className="size-4" /> Full series unlocked
                  </span>
                ) : own?.pendingSeries ? (
                  <span className={cn("text-small inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-6 font-medium text-primary", inDashboard ? "h-12" : "h-14")}><Clock className="size-4" /> Payment awaiting verification</span>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <Button variant="glass" size={inDashboard ? "lg" : "xl"} onClick={() => startBuy(null)}>
                      <ShoppingCart /> Unlock all episodes · <PriceTag price={series.price_bdt} discount={series.discount_price_bdt} />
                    </Button>
                    <span className="text-caption pl-6 text-muted-foreground">bKash · Nagad{buyable.some((e) => e.price_bdt) ? " · or buy single episodes" : ""}</span>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className={cn("grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14", inDashboard ? "" : cn(wrap, "py-12"))}>
        <section aria-labelledby="episodes-title" className={inDashboard ? "rounded-md border border-border bg-card p-5 sm:p-6" : undefined}>
          <div className="flex items-end justify-between">
            <h2 id="episodes-title" className="text-h3 font-semibold">Episodes</h2>
            <span className="text-eyebrow text-muted-foreground">Season 1</span>
          </div>
          <ol className="mt-6">
            {series.episodes.map((ep) => {
              const open = ep.is_free || episodeOpen(ep.id);
              const pending = !open && (own?.pendingEpisodes.has(ep.id) || own?.pendingSeries);
              const thumb = mediaUrl(ep.thumbnail_url ?? series.backdrop_url);
              return (
                <li key={ep.id} className="border-b border-border last:border-0">
                  <Link
                    to={watchTo}
                    params={{ episodeId: ep.id }}
                    className="group/ep flex gap-4 py-4"
                    onClick={(e) => { if (!open && !pending && !isStaff) { e.preventDefault(); startBuy(ep.id); } }}
                  >
                    <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-[4px] bg-muted sm:w-52">
                      {thumb ? <img src={thumb} alt="" loading="lazy" width={480} height={270} className="size-full object-cover transition-transform duration-700 ease-out group-hover/ep:scale-[1.03]" /> : null}
                      <div className="absolute inset-0 bg-scrim/30 transition-colors duration-300 group-hover/ep:bg-transparent" />
                      <span className="absolute inset-0 grid place-items-center">
                        <span className={cn("grid size-10 place-items-center rounded-full", open ? "bg-primary text-primary-foreground" : "bg-scrim text-media-ink backdrop-blur-sm")}>
                          {open ? <Play className="size-4 translate-x-px fill-current" /> : <Lock className="size-4" />}
                        </span>
                      </span>
                      <span className="text-caption absolute bottom-1.5 right-1.5 rounded-sm bg-scrim px-1.5 py-0.5 tabular-nums text-media-ink">{formatDuration(ep.duration_seconds)}</span>
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-body font-medium text-foreground/85 transition-colors duration-300 group-hover/ep:text-foreground">
                          <span className="mr-2 text-small tabular-nums text-muted-foreground">{String(ep.episode_number).padStart(2, "0")}</span>
                          {ep.title}
                        </p>
                        <span
                          className={cn(
                            "text-caption inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 font-medium",
                            ep.is_free ? "bg-primary/15 text-primary" : open ? "bg-success/15 text-success" : "bg-foreground/10 text-muted-foreground",
                          )}
                        >
                          {ep.is_free ? "Free" : open ? "Unlocked" : pending ? "Verifying" : ep.price_bdt ? <PriceTag price={ep.price_bdt} discount={ep.sale_price_bdt} badge={false} className="text-caption" /> : "Locked"}
                        </span>
                      </div>
                      <RichText html={ep.synopsis_html} className="mt-1.5 line-clamp-2 text-sm text-muted-foreground sm:line-clamp-3" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
        <aside aria-labelledby="about-title" className="lg:sticky lg:top-24 lg:self-start">
          <div className={cn("rounded-md border border-border p-6", inDashboard ? "bg-card" : "bg-surface")}>
            <h2 id="about-title" className="text-h3 font-semibold">About</h2>
            <RichText html={series.description_html} className="mt-4 text-foreground/85" />
            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 border-t border-foreground/10 pt-5 text-sm">
              <dt className="text-muted-foreground">Genres</dt>
              <dd>{series.genres.join(", ")}</dd>
              {series.release_year ? (
                <>
                  <dt className="text-muted-foreground">Released</dt>
                  <dd className="tabular-nums">{series.release_year}</dd>
                </>
              ) : null}
              {series.maturity_rating ? (
                <>
                  <dt className="text-muted-foreground">Rating</dt>
                  <dd className="tabular-nums">{series.maturity_rating}</dd>
                </>
              ) : null}
              <dt className="text-muted-foreground">Price</dt>
              <dd className="tabular-nums">{series.price_bdt > 0 ? <><PriceTag price={series.price_bdt} discount={series.discount_price_bdt} /> · full season</> : "Free"}</dd>
            </dl>
          </div>
        </aside>
      </div>

      {more.length ? (
        <div className={inDashboard ? undefined : cn(wrap, "pb-20")}>
          <MediaRow title="More like this" seeAll={!inDashboard}>
            {more.map((s) => (
              <SeriesCard key={s.id} {...s} to={seriesTo} hasFreeEpisode={s.episodes.some((e) => e.is_free)} episodeCount={s.episodes.length} className={posterItem} />
            ))}
          </MediaRow>
        </div>
      ) : null}
      {buying ? <PurchaseDialog open onClose={() => setBuying(null)} focusEpisodeId={buying.episodeId} episodes={buyable}
        series={{ id: series.id, title: series.title, price_bdt: hasAccess || own?.pendingSeries ? 0 : series.price_bdt, image: series.poster_url ?? series.backdrop_url }} /> : null}
    </div>
  );
}

function sharedGenres(a: string[], b: string[]) {
  return a.filter((g) => b.includes(g)).length;
}
