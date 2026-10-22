import { absoluteMediaUrl } from "@/lib/media";
import { SITE_URL, jsonLd } from "@/lib/content-seo";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Eyebrow } from "@/components/layout/primitives";
import { SiteShell } from "@/components/site/SiteShell";
import { SeriesCard } from "@/components/catalog/SeriesCard";
import { catalogQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

type BrowseSearch = { genre?: string | undefined };

export const Route = createFileRoute("/browse")({
  staticData: { sitemap: true },
  validateSearch: (search: Record<string, unknown>): BrowseSearch => ({
    genre: typeof search["genre"] === "string" && search["genre"].length <= 60 ? search["genre"] : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  head: ({ loaderData }) => {
    const s = loaderData?.find((x) => x.is_featured && x.backdrop_url) ?? loaderData?.find((x) => x.backdrop_url);
    const img = absoluteMediaUrl(s?.backdrop_url);
    return {
    meta: [
      ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      { title: "Browse AI-generated series — Branta Films" },
      { name: "description", content: "Explore Branta Films’ curated AI-generated web series by genre and discover your next story." },
      { property: "og:title", content: "Browse AI-generated series — Branta Films" },
      { property: "og:description", content: "Explore Branta Films’ curated AI-generated web series by genre, search titles, and discover your next series to watch." },
      { property: "og:url", content: SITE_URL + "/browse" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/browse" }],
    scripts: [jsonLd({ "@context": "https://schema.org", "@type": "CollectionPage", name: "Browse AI-generated series", url: SITE_URL + "/browse", mainEntity: { "@type": "ItemList", itemListElement: (loaderData ?? []).map((series, i) => ({ "@type": "ListItem", position: i + 1, name: series.title, url: `${SITE_URL}/series/${series.slug}` })) } })],
    };
  },
  component: BrowsePage,
});

function BrowsePage() {
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const { genre } = Route.useSearch();
  const navigate = useNavigate({ from: "/browse" });
  const [q, setQ] = useState("");
  const genres = useMemo(() => Array.from(new Set(catalog.flatMap((s) => s.genres))).sort(), [catalog]);
  const needle = q.trim().toLowerCase();
  const list = catalog.filter(
    (s) =>
      (!genre || s.genres.includes(genre)) &&
      (!needle || s.title.toLowerCase().includes(needle) || (s.tagline ?? "").toLowerCase().includes(needle)),
  );

  return (
    <SiteShell>
      <div className="ambient-glow">
        <div className="mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] pb-20 pt-16 md:pt-20">
          <Eyebrow>Library</Eyebrow>
          <h1 className="text-display mt-6">Browse series<span className="text-primary">.</span></h1>
          <p className="text-body-lg mt-6 max-w-xl text-muted-foreground">Curated AI-generated web series, all in one place.</p>

          <div className="sticky top-16 z-30 -mx-2 mt-8 px-2 py-3">
            <div className="flex flex-col gap-3 rounded-md border border-border bg-background/90 p-3 backdrop-blur-xl md:flex-row md:items-center">
              <label className="relative flex min-w-0 items-center md:w-80">
                <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
                <span className="sr-only">Search series</span>
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search titles"
                  className="text-small h-10 w-full rounded-full border border-input bg-surface pl-10 pr-10 outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
                />
                {q ? (
                  <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="absolute right-2 grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground">
                    <X className="size-4" />
                  </button>
                ) : null}
              </label>
              <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Filter by genre">
                {[undefined, ...genres].map((g) => {
                  const active = genre === g;
                  return (
                    <button
                      key={g ?? "all"}
                      type="button"
                      onClick={() => void navigate({ search: { genre: g }, replace: true })}
                      aria-pressed={active}
                      className={cn(
                        "text-small h-10 shrink-0 rounded-full border px-4 font-medium transition-[background-color,border-color,color] duration-300",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-surface text-muted-foreground hover:border-foreground hover:text-foreground",
                      )}
                    >
                      {g ?? "All"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-5">
            {list.map((s) => (
              <SeriesCard key={s.id} {...s} hasFreeEpisode={s.episodes.some((e) => e.is_free)} episodeCount={s.episodes.length} />
            ))}
          </div>
          {!list.length ? (
            <div className="mt-6 rounded-md border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">{needle ? `Nothing matches “${q.trim()}”.` : "No series in this genre yet."}</p>
            </div>
          ) : null}
        </div>
      </div>
    </SiteShell>
  );
}
