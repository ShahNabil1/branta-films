import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Compass, Film } from "lucide-react";
import { SeriesCard } from "@/components/catalog/SeriesCard";
import { PageHeader, Panel } from "@/components/dashboard/DashboardKit";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/account/library")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "My library — Branta Films" },
      { name: "description", content: "Series you have unlocked on Branta Films." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "My library — Branta Films" },
      { property: "og:description", content: "Series you have unlocked on Branta Films." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { user } = useAuth();
  const { data, isPending } = useQuery({
    queryKey: ["library", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series_unlocks")
        .select("created_at, series:series_id(id, slug, title, poster_url, genres, price_bdt, release_year)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => r.series).filter(Boolean) as unknown as {
        id: string;
        slug: string;
        title: string;
        poster_url: string | null;
        genres: string[];
        price_bdt: number;
        release_year: number | null;
      }[];
    },
  });

  return (
    <>
      <PageHeader
        icon={Film}
        eyebrow="Library"
        title="My library"
        description="Every series you've unlocked lives here — all episodes, on every device."
      />
      <Panel delay={80}>
        {isPending ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : data?.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {data.map((s) => (
              <SeriesCard key={s.id} {...s} to="/account/series/$slug" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Film className="size-5" aria-hidden />
            </span>
            <p className="text-h4 mt-5 font-semibold">Nothing unlocked yet</p>
            <p className="text-small mt-2 max-w-sm text-muted-foreground">
              Every series starts free with episode one. Unlock a full season to keep it here.
            </p>
            <Button asChild size="sm" className="mt-6">
              <Link to="/account/explore">
                <Compass /> Explore series
              </Link>
            </Button>
          </div>
        )}
      </Panel>
    </>
  );
}
