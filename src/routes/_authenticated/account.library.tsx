import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SeriesCard } from "@/components/catalog/SeriesCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/account/library")({
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
    <div>
      <p className="text-eyebrow text-primary">Library</p>
      <h1 className="mt-3 text-h2">My library</h1>
      <p className="mt-2 text-sm text-muted-foreground">Series you've unlocked appear here.</p>
      {isPending ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-surface" />
          ))}
        </div>
      ) : data?.length ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((s) => (
            <SeriesCard key={s.id} {...s} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-md border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">You haven't unlocked any series yet.</p>
          <Link to="/browse" className="mt-3 inline-block text-sm text-primary hover:underline">
            Browse series →
          </Link>
        </div>
      )}
    </div>
  );
}
