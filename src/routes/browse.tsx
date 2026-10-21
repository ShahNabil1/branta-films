import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { SeriesCard } from "@/components/catalog/SeriesCard";
import { catalogQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

type BrowseSearch = { genre?: string };

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>): BrowseSearch => ({
    genre: typeof search.genre === "string" && search.genre.length <= 60 ? search.genre : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse series — Branta Films" },
      { name: "description", content: "Browse every Branta Films original series by genre — thrillers, family dramas, mysteries and more." },
      { property: "og:title", content: "Browse series — Branta Films" },
      { property: "og:description", content: "Every Branta Films original series in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
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
        <div className="mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] pb-20 pt-14">
          <p className="text-eyebrow text-primary">Library</p>
          <h1 className="mt-4 text-h1">Browse series</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">Every Branta original in one place. Episode one is always free.</p>

          <div className="sticky top-16 z-30 -mx-2 mt-8 px-2 py-3">
            <div className="glass-strong flex flex-col gap-3 rounded-2xl p-3 md:flex-row md:items-center">
              <label className="relative flex min-w-0 items-center md:w-80">
                <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
                <span className="sr-only">Search series</span>
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search titles"
                  className="h-10 w-full rounded-full border border-foreground/10 bg-background/60 pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
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
                        "h-10 shrink-0 rounded-full border px-4 text-sm transition-[background-color,border-color,color,box-shadow] duration-300",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-glow-soft"
                          : "border-foreground/10 bg-foreground/5 text-foreground/75 hover:border-foreground/25 hover:text-foreground",
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
            <div className="glass mt-6 rounded-2xl p-10 text-center">
              <p className="text-sm text-muted-foreground">{needle ? `Nothing matches “${q.trim()}”.` : "No series in this genre yet."}</p>
            </div>
          ) : null}
        </div>
      </div>
    </SiteShell>
  );
}
