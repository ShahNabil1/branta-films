import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

/** What the signed-in viewer owns (or has awaiting verification) within one series. */
export function useOwnership(seriesId: string | undefined, episodeIds: string[]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ownership", seriesId, user?.id],
    enabled: Boolean(user && seriesId),
    queryFn: async () => {
      const [s, e, p] = await Promise.all([
        supabase.from("series_unlocks").select("id").eq("series_id", seriesId!).eq("user_id", user!.id).maybeSingle(),
        episodeIds.length ? supabase.from("episode_unlocks").select("episode_id").eq("user_id", user!.id).in("episode_id", episodeIds) : Promise.resolve({ data: [] as { episode_id: string }[] }),
        supabase.from("order_items").select("item_type, item_id, orders!inner(user_id, status)").eq("orders.user_id", user!.id).eq("orders.status", "pending"),
      ]);
      const pending = new Set((p.data ?? []).map((r) => `${r.item_type}:${r.item_id}`));
      return {
        series: Boolean(s.data),
        episodes: new Set((e.data ?? []).map((r) => r.episode_id)),
        pendingSeries: pending.has(`series:${seriesId}`),
        pendingEpisodes: new Set([...pending].filter((k) => k.startsWith("episode:")).map((k) => k.slice(8))),
      };
    },
  });
}
