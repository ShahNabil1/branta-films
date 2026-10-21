import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { useMemo } from "react";
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
          <MediaRow eyebrow="Top on Branta" title="Trending now" seeAll>
            {catalog.slice(0, 10).map((s, i) => (
              <div key={s.id} className="flex shrink-0 snap-start items-end">
                <span aria-hidden="true" className="ranked-numeral -mr-4 mb-12 select-none text-[7rem] sm:-mr-6 sm:text-[9.5rem]">
                  {i + 1}
                </span>
                <SeriesCard {...cardProps(s)} className="relative w-[8.5rem] sm:w-[10.5rem]" />
              </div>
            ))}
          </MediaRow>
        ) : (
          <p className="pt-24 text-sm text-muted-foreground">New series are coming soon.</p>
        )}

        {free.length ? (
          <MediaRow eyebrow="On the house" title="Start free — episode 1 on us">
            {free.map((s) => (
              <SeriesCard key={s.id} {...cardProps(s)} className={posterItem} />
            ))}
          </MediaRow>
        ) : null}

        <PromoBanner backdrop={mediaUrl(catalog[1]?.backdrop_url ?? catalog[0]?.backdrop_url)} />

        {genres
          .filter(([, list]) => list.length > 1)
          .map(([genre, list]) => (
            <MediaRow key={genre} eyebrow="Category" title={genre} seeAll>
              {list.map((s) => (
                <SeriesCard key={s.id} {...cardProps(s)} className={posterItem} />
              ))}
            </MediaRow>
          ))}

        {genres.length ? (
          <section aria-labelledby="genres-title">
            <p className="text-eyebrow text-primary">Explore</p>
            <h2 id="genres-title" className="mt-2 text-h3 font-semibold">Browse by genre</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {genres.map(([genre, list]) => {
                const img = mediaUrl(list[0]?.backdrop_url ?? list[0]?.poster_url);
                return (
                  <Link
                    key={genre}
                    to="/browse"
                    search={{ genre }}
                    className="group/genre relative isolate flex aspect-[16/10] items-end overflow-hidden rounded-lg glass p-4 transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow"
                  >
                    {img ? (
                      <img src={img} alt="" loading="lazy" width={480} height={300} className="absolute inset-0 -z-20 size-full object-cover opacity-45 transition-[transform,opacity] duration-700 group-hover/genre:scale-110 group-hover/genre:opacity-70" />
                    ) : null}
                    <div className="card-fade absolute inset-0 -z-10" />
                    <div>
                      <p className="font-semibold text-media-ink">{genre}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-media-ink/70">{list.length} series</p>
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
    <section className="relative isolate overflow-hidden rounded-2xl glass-strong">
      {backdrop ? <img src={backdrop} alt="" loading="lazy" width={1600} height={900} className="absolute inset-0 -z-20 size-full object-cover opacity-30" /> : null}
      <div className="hero-fade absolute inset-0 -z-10" />
      <div className="ambient-glow absolute inset-0 -z-10" />
      <div className="hairline-glow absolute inset-x-0 top-0 h-px" aria-hidden="true" />
      <div className="flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 text-eyebrow text-primary">
            <Sparkles className="size-3.5" /> One payment, whole season
          </p>
          <h2 className="mt-3 text-h2">Unlock every episode of a series — pay once with bKash or Nagad.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">No subscription. Episode one is always free, so you can try before you unlock.</p>
        </div>
        <Button asChild variant="hero" size="xl" className="shrink-0 rounded-full">
          <Link to="/browse">
            Browse series <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
