import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { Eyebrow } from "@/components/layout/primitives";
import { SiteShell } from "@/components/site/SiteShell";
import { SeriesCard } from "@/components/catalog/SeriesCard";
import { ContinueWatching } from "@/components/catalog/ContinueWatching";
import { HeroCarousel } from "@/components/catalog/HeroCarousel";
import { MediaRow, posterItem } from "@/components/catalog/MediaRow";
import { Button } from "@/components/ui/button";
import type { CatalogSeries } from "@/lib/catalog.functions";
import { catalogQuery } from "@/lib/queries";
import { mediaUrl } from "@/lib/media";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Branta Films — Original series by Branta Tech" },
      { name: "description", content: "Stream premium original series from Branta Tech. Start free with episode one, unlock full seasons with bKash or Nagad." },
      { property: "og:title", content: "Branta Films — Original series by Branta Tech" },
      { property: "og:description", content: "Stream premium original series. Start free with episode one." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: HomePage,
});

function cardProps(s: CatalogSeries) {
  return { ...s, hasFreeEpisode: s.episodes.some((e) => e.is_free), episodeCount: s.episodes.length };
}

function HomePage() {
  const { data: catalog } = useSuspenseQuery(catalogQuery);

  const hero = useMemo(() => [...catalog].sort((a, b) => Number(b.is_featured) - Number(a.is_featured)).slice(0, 5), [catalog]);
  const free = catalog.filter((s) => s.episodes.some((e) => e.is_free));
  const genres = useMemo(() => {
    const map = new Map<string, CatalogSeries[]>();
    for (const s of catalog) for (const g of s.genres) map.set(g, [...(map.get(g) ?? []), s]);
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [catalog]);

  return (
    <SiteShell overlayHeader>
      <HeroCarousel slides={hero} />

      <div className="relative z-10 -mt-20 mx-auto max-w-[1440px] space-y-14 px-[clamp(1.25rem,4vw,3rem)] pb-20 md:-mt-28">
        <ContinueWatching />

        {catalog.length ? (
          <MediaRow title="Trending now" seeAll>
            {catalog.slice(0, 10).map((s, i) => (
              <div key={s.id} className="flex shrink-0 snap-start items-end">
                <span aria-hidden="true" className="ranked-numeral -mr-2 mb-12 select-none text-[7.5rem] sm:-mr-3 sm:text-[10rem]">
                  {i + 1}
                </span>
                <SeriesCard {...cardProps(s)} className="relative w-[8.5rem] sm:w-[10.5rem]" />
              </div>
            ))}
          </MediaRow>
        ) : (
          <p className="pt-24 text-sm text-muted-foreground">New series are coming soon.</p>
        )}

        {free.length && free.length < catalog.length ? (
          <MediaRow title="Start free — episode 1 on us">
            {free.map((s) => (
              <SeriesCard key={s.id} {...cardProps(s)} className={posterItem} />
            ))}
          </MediaRow>
        ) : null}

        <PromoBanner backdrop={mediaUrl(catalog[1]?.backdrop_url ?? catalog[0]?.backdrop_url)} />

        {genres
          .filter(([, list]) => list.length > 1)
          .map(([genre, list]) => (
            <MediaRow key={genre} title={genre} seeAll>
              {list.map((s) => (
                <SeriesCard key={s.id} {...cardProps(s)} className={posterItem} />
              ))}
            </MediaRow>
          ))}

        {genres.length ? (
          <section aria-labelledby="genres-title">
            <Eyebrow>Explore</Eyebrow>
            <h2 id="genres-title" className="mt-3 text-h3 font-semibold">Browse by genre</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {genres.map(([genre, list]) => {
                const img = mediaUrl(list[0]?.backdrop_url ?? list[0]?.poster_url);
                return (
                  <Link
                    key={genre}
                    to="/browse"
                    search={{ genre }}
                    className="group block min-w-0 rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[4px] bg-muted">
                      {img ? (
                        <img src={img} alt="" loading="lazy" width={480} height={300} className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                      ) : null}
                      <span className="text-caption pointer-events-none absolute bottom-3 left-3 rounded-[3px] bg-scrim px-2 py-1 font-medium text-media-ink backdrop-blur-sm">
                        {list.length} series
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-body truncate font-medium text-foreground/85 transition-colors duration-300 group-hover:text-foreground">{genre}</p>
                      <span aria-hidden className="text-primary opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </SiteShell>
  );
}

function PromoBanner({ backdrop }: { backdrop: string | null }) {
  return (
    <section className="relative isolate overflow-hidden rounded-md border border-border bg-surface">
      {backdrop ? <img src={backdrop} alt="" loading="lazy" width={1600} height={900} className="absolute inset-0 -z-20 size-full object-cover opacity-30" /> : null}
      <div className="hero-fade absolute inset-0 -z-10" />
      <div className="ambient-glow absolute inset-0 -z-10" />
      <div className="hairline-glow absolute inset-x-0 top-0 h-px" aria-hidden="true" />
      <div className="flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12">
        <div className="max-w-xl">
          <Eyebrow>One payment, whole season</Eyebrow>
          <h2 className="mt-5 text-h2">Unlock every episode of a series — pay once with bKash or Nagad.</h2>
          <p className="text-body mt-4 text-muted-foreground">No subscription. Episode one is always free, so you can try before you unlock.</p>
        </div>
        <Button asChild size="xl" className="discover-action discover-action-solid shrink-0">
          <Link to="/browse">
            Browse series <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
