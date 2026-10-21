import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ContinueItem = {
  episode_id: string;
  position_seconds: number;
  duration_seconds: number;
  updated_at: string;
  episode: { id: string; title: string; episode_number: number } | null;
  series: { id: string; slug: string; title: string; backdrop_url: string | null; poster_url: string | null } | null;
};

export const continueWatchingQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["continue-watching", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<ContinueItem[]> => {
      const { data, error } = await supabase
        .from("watch_progress")
        .select(
          "episode_id, position_seconds, duration_seconds, updated_at, episode:episode_id(id, title, episode_number), series:series_id(id, slug, title, backdrop_url, poster_url)",
        )
        .eq("user_id", userId!)
        .eq("completed", false)
        .gt("position_seconds", 5)
        .order("updated_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as unknown as ContinueItem[];
    },
  });

export async function saveProgress(input: {
  userId: string;
  episodeId: string;
  seriesId: string;
  position: number;
  duration: number;
  completed: boolean;
}) {
  if (!input.duration || !Number.isFinite(input.position)) return;
  await supabase.from("watch_progress").upsert(
    {
      user_id: input.userId,
      episode_id: input.episodeId,
      series_id: input.seriesId,
      position_seconds: Math.floor(input.position),
      duration_seconds: Math.floor(input.duration),
      completed: input.completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,episode_id" },
  );
}
