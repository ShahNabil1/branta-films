import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Info, Play } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { SeriesCard } from "@/components/catalog/SeriesCard";
import { ContinueWatching } from "@/components/catalog/ContinueWatching";
import { Button } from "@/components/ui/button";
import { catalogQuery } from "@/lib/queries";
import { mediaUrl } from "@/lib/media";
import { formatTaka } from "@/lib/format";

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

function HomePage() {
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const featured = catalog.find((s) => s.is_featured) ?? catalog[0];
  const backdrop = mediaUrl(featured?.backdrop_url);

  return (
    <SiteShell overlayHeader>
      {featured ? (
        <section className="relative isolate flex min-h-[min(88svh,820px)] items-end overflow-hidden">
          {backdrop ? (
            <img src={backdrop} alt="" width={1920} height={1080} className="absolute inset-0 -z-20 size-full object-cover" fetchPriority="high" />
          ) : null}
          <div className="hero-fade absolute inset-0 -z-10" />
          <div className="mx-auto w-full max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] pb-16 pt-32 md:pb-24">
            <p className="animate-fade-up text-eyebrow text-primary">Branta Original · {featured.genres.join(" / ")}</p>
            <h1 className="animate-fade-up mt-5 max-w-[12ch] text-display">{featured.title}</h1>
            <p className="animate-fade-up mt-5 max-w-xl text-lg leading-relaxed text-foreground/80">{featured.tagline}</p>
            <div className="animate-fade-up mt-4 flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
              <span className="rounded-sm border border-border px-1.5 py-0.5">{featured.maturity_rating}</span>
              <span>{featured.release_year}</span>
              <span>{featured.episodes.length} episodes</span>
              {featured.price_bdt > 0 ? <span>Full season {formatTaka(featured.price_bdt)}</span> : null}
            </div>
            <div className="animate-fade-up mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-sm px-6 text-base">
                <Link to="/series/$slug" params={{ slug: featured.slug }}>
                  <Play className="fill-current" /> Watch episode 1 free
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-sm border-foreground/30 bg-transparent px-6 text-base hover:bg-foreground/10">
                <Link to="/series/$slug" params={{ slug: featured.slug }}>
                  <Info /> More info
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-[1440px] space-y-16 px-[clamp(1.25rem,4vw,3rem)] py-16">
        <ContinueWatching />
        <section aria-labelledby="all-series">
          <div className="flex items-end justify-between gap-4">
            <h2 id="all-series" className="text-h3">All series</h2>
            <Link to="/browse" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              Browse all →
            </Link>
          </div>
          {catalog.length ? (
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
              {catalog.map((s) => (
                <SeriesCard key={s.id} {...s} hasFreeEpisode={s.episodes.some((e) => e.is_free)} />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">New series are coming soon.</p>
          )}
        </section>
      </div>
    </SiteShell>
  );
}
