import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Compass, Film, LayoutDashboard, Search, ShoppingBag, Tags } from "lucide-react";
import { ContinueWatching } from "@/components/catalog/ContinueWatching";
import { PageHeader, Panel, StatTile } from "@/components/dashboard/DashboardKit";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { displayName, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/account/")({
  head: () => ({
    meta: [
      { title: "My dashboard — Branta Films" },
      { name: "description", content: "Your Branta Films dashboard: continue watching and manage your account." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "My dashboard — Branta Films" },
      { property: "og:description", content: "Continue watching and manage your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountOverview,
});

function AccountOverview() {
  const { profile, user } = useAuth();
  const { data: counts } = useQuery({
    queryKey: ["account-counts", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) return { unlocks: 0, progress: 0 };
      const [unlocks, progress] = await Promise.all([
        supabase.from("series_unlocks").select("series_id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("watch_progress").select("episode_id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      return { unlocks: unlocks.count ?? 0, progress: progress.count ?? 0 };
    },
  });

  return (
    <>
      <PageHeader
        icon={LayoutDashboard}
        eyebrow="Dashboard"
        title={`Hi, ${displayName(profile, user)}`}
        description="Pick up where you left off, see what you've unlocked and keep your account secure."
        action={
          <Button asChild size="sm">
            <Link to="/account/explore">
              <Compass /> Explore series
            </Link>
          </Button>
        }
      />
      <Link
        to="/account/explore"
        className="group relative block overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary/25 via-surface to-surface p-5 transition-[border-color,transform] duration-300 hover:border-primary active:scale-[0.99] sm:p-7"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/30 blur-3xl transition-opacity duration-500 group-hover:opacity-80" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary"><Compass className="size-3.5" />Explore series</span>
            <h2 className="mt-3 text-xl font-semibold sm:text-2xl">Every series, all in one place</h2>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">Search titles, filter by genre, buy a full series or single episodes, and check out — without leaving your dashboard.</p>
            <ul className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <li className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1"><Search className="size-3.5 text-primary" />Search</li>
              <li className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1"><Tags className="size-3.5 text-primary" />Genres</li>
              <li className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1"><ShoppingBag className="size-3.5 text-primary" />Buy & cart</li>
            </ul>
          </div>
          <span className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform duration-300 group-hover:translate-x-1">
            Start exploring <ArrowRight className="size-4" />
          </span>
        </div>
      </Link>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <StatTile to="/account" icon={LayoutDashboard} label="Episodes in progress" value={counts?.progress ?? "–"} delay={60} compactMobile />
        <StatTile to="/account/library" icon={Film} label="Series unlocked" value={counts?.unlocks ?? "–"} delay={120} compactMobile />
      </div>
      <Panel delay={240}>
        <ContinueWatching inDashboard emptyText="Nothing in progress yet. Start an episode and it will appear here." />
      </Panel>
    </>
  );
}
