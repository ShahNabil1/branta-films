import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, Compass, Play, Search, ShoppingBag, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SeriesCard } from "@/components/catalog/SeriesCard";
import { PurchaseDialog } from "@/components/commerce/PurchaseDialog";
import { CartButton } from "@/components/commerce/CartSheet";
import { PageHeader, Panel } from "@/components/dashboard/DashboardKit";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useOwnership } from "@/lib/ownership";
import { catalogQuery, seriesQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/account/explore")({
  head: () => ({
    meta: [
      { title: "Explore series — Branta Films" },
      { name: "description", content: "Search, filter by genre and buy any Branta Films series from your dashboard." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Explore series — Branta Films" },
      { property: "og:description", content: "Every Branta Films series, right inside your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: ExplorePage,
});

function ExplorePage() {
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const { user, isStaff } = useAuth();
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [buySlug, setBuySlug] = useState<string | null>(null);

  const { data: owned } = useQuery({
    queryKey: ["owned-series", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase.from("series_unlocks").select("series_id").eq("user_id", user!.id);
      return new Set((data ?? []).map((r) => r.series_id));
    },
  });

  const genres = useMemo(() => Array.from(new Set(catalog.flatMap((s) => s.genres))).sort(), [catalog]);
  const needle = q.trim().toLowerCase();
  const list = catalog.filter(
    (s) =>
      (!genre || s.genres.includes(genre)) &&
      (!needle || s.title.toLowerCase().includes(needle) || (s.tagline ?? "").toLowerCase().includes(needle)),
  );

  return (
    <>
      <PageHeader icon={Compass} eyebrow="Explore" title="All series" description="Search, filter and buy any series without leaving your dashboard." />
      <Panel delay={60}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex min-w-0 items-center md:w-80">
            <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
            <span className="sr-only">Search series</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search titles"
              className="text-small h-10 w-full rounded-full border border-input bg-surface pl-10 pr-10 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            {q ? (
              <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="absolute right-2 grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground">
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto" role="group" aria-label="Filter by genre">
            {[null, ...genres].map((g) => {
              const active = genre === g;
              return (
                <button
                  key={g ?? "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setGenre(g)}
                  className={cn(
                    "text-small h-10 shrink-0 rounded-full border px-4 font-medium transition-colors duration-300 active:scale-95",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-surface text-muted-foreground hover:border-primary/60 hover:text-foreground",
                  )}
                >
                  {g ?? "All"}
                </button>
              );
            })}
          </div>
          <div className="hidden md:block"><CartButton /></div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {list.map((s) => {
            const isOwned = isStaff || Boolean(owned?.has(s.id));
            return (
              <div key={s.id} className="flex min-w-0 flex-col gap-3">
                <div className="relative">
                  <SeriesCard {...s} hasFreeEpisode={s.episodes.some((e) => e.is_free)} episodeCount={s.episodes.length} />
                  {isOwned ? (
                    <span className="text-caption pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-success px-2 py-1 font-semibold text-background">
                      <CheckCircle2 className="size-3.5" />Unlocked
                    </span>
                  ) : null}
                </div>
                {isOwned ? (
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link to="/series/$slug" params={{ slug: s.slug }}><Play />Watch now</Link>
                  </Button>
                ) : (
                  <Button size="sm" className="w-full" onClick={() => setBuySlug(s.slug)}><ShoppingBag />Buy</Button>
                )}
              </div>
            );
          })}
        </div>
        {!list.length ? (
          <div className="mt-6 rounded-md border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">{needle ? `Nothing matches “${q.trim()}”.` : "No series in this genre yet."}</p>
          </div>
        ) : null}
      </Panel>
      {buySlug ? <BuyLauncher slug={buySlug} onClose={() => setBuySlug(null)} /> : null}
    </>
  );
}

/** Loads one series' episodes and ownership, then opens the shared purchase window. */
function BuyLauncher({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { data: series } = useQuery(seriesQuery(slug));
  const { isStaff } = useAuth();
  const { data: own, isPending } = useOwnership(series?.id, series?.episodes.map((e) => e.id) ?? []);
  if (!series || isPending) return null;
  const hasAccess = Boolean(own?.series) || isStaff;
  const buyable = series.episodes
    .filter((e) => !e.is_free && !hasAccess && !own?.episodes.has(e.id) && !own?.pendingEpisodes.has(e.id))
    .map((e) => ({ id: e.id, episode_number: e.episode_number, title: e.title, price_bdt: e.price_bdt, image: e.thumbnail_url ?? series.backdrop_url }));
  return (
    <PurchaseDialog
      open
      onClose={onClose}
      focusEpisodeId={null}
      episodes={buyable}
      series={{ id: series.id, title: series.title, price_bdt: hasAccess || own?.pendingSeries ? 0 : series.price_bdt, image: series.poster_url ?? series.backdrop_url }}
    />
  );
}
