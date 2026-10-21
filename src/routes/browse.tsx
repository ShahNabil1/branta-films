import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { SeriesCard } from "@/components/catalog/SeriesCard";
import { catalogQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/browse")({
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
  const genres = useMemo(() => Array.from(new Set(catalog.flatMap((s) => s.genres))).sort(), [catalog]);
  const [genre, setGenre] = useState<string | null>(null);
  const list = genre ? catalog.filter((s) => s.genres.includes(genre)) : catalog;

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] py-14">
        <p className="text-eyebrow text-primary">Library</p>
        <h1 className="mt-4 text-h1">Browse series</h1>
        <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto" role="group" aria-label="Filter by genre">
          {[null, ...genres].map((g) => (
            <button
              key={g ?? "all"}
              type="button"
              onClick={() => setGenre(g)}
              aria-pressed={genre === g}
              className={cn(
                "shrink-0 rounded-sm border px-3 py-1.5 text-sm transition-colors",
                genre === g ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {g ?? "All"}
            </button>
          ))}
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((s) => (
            <SeriesCard key={s.id} {...s} hasFreeEpisode={s.episodes.some((e) => e.is_free)} />
          ))}
        </div>
        {!list.length ? <p className="mt-10 text-sm text-muted-foreground">No series in this genre yet.</p> : null}
      </div>
    </SiteShell>
  );
}
