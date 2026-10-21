import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Compass, Film, LayoutDashboard, Shield } from "lucide-react";
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
      const [unlocks, progress, keys] = await Promise.all([
        supabase.from("series_unlocks").select("series_id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("watch_progress").select("episode_id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("passkey_credentials").select("id", { count: "exact", head: true }),
      ]);
      return { unlocks: unlocks.count ?? 0, progress: progress.count ?? 0, passkeys: keys.count ?? 0 };
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
            <Link to="/browse">
              <Compass /> Browse series
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile to="/account" icon={LayoutDashboard} label="Episodes in progress" value={counts?.progress ?? "–"} delay={60} />
        <StatTile to="/account/library" icon={Film} label="Series unlocked" value={counts?.unlocks ?? "–"} delay={120} />
        <StatTile to="/account/security" icon={Shield} label="Passkeys" value={counts?.passkeys ?? "–"} hint="Sign in without a password" delay={180} />
      </div>
      <Panel delay={240}>
        <ContinueWatching emptyText="Nothing in progress yet. Start an episode and it will appear here." />
      </Panel>
    </>
  );
}
