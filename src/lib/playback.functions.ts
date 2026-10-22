import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAccountAccess } from "./security-middleware";
import { decidePlayback, PLAYBACK_LINK_TTL_SECONDS, type PlaybackDecision } from "./access";

export type PlaybackResult =
  | { status: "allowed"; url: string; expiresAt: number; contentType: string }
  | { status: Exclude<PlaybackDecision, "allowed"> | "not_uploaded" | "not_configured" };

/**
 * Issues a short-lived signed link to the episode's video after verifying
 * access in the database. The storage key itself never leaves the server.
 */
export const getPlaybackSource = createServerFn({ method: "POST" })
  .middleware([requireAccountAccess])
  .inputValidator((input: unknown) => z.object({ episodeId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<PlaybackResult> => {
    const { supabase, userId } = context;

    const [{ data: episode }, { data: staff }] = await Promise.all([
      supabase
        .from("episodes")
        .select("id, series_id, is_free, is_published, series:series_id(is_published)")
        .eq("id", data.episodeId)
        .maybeSingle(),
      supabase.rpc("is_staff", { _user_id: userId }),
    ]);
    if (!episode) return { status: "unavailable" };

    const { data: unlock } = await supabase
      .from("series_unlocks")
      .select("id")
      .eq("user_id", userId)
      .eq("series_id", episode.series_id)
      .maybeSingle();

    const seriesPublished = (episode.series as { is_published: boolean } | null)?.is_published ?? false;
    const decision = decidePlayback({
      signedIn: true,
      isStaff: Boolean(staff),
      published: episode.is_published && seriesPublished,
      isFree: episode.is_free,
      unlocked: Boolean(unlock),
    });
    if (decision !== "allowed") return { status: decision };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: media } = await supabaseAdmin
      .from("episode_media")
      .select("video_key, content_type")
      .eq("episode_id", episode.id)
      .maybeSingle();
    if (!media) return { status: "not_uploaded" };

    const { presignR2Get, r2ObjectExists } = await import("./r2.server");
    try {
      if (!(await r2ObjectExists(media.video_key))) return { status: "not_uploaded" };
      const url = await presignR2Get(media.video_key, PLAYBACK_LINK_TTL_SECONDS);
      const { logActivityAs } = await import("./request-meta.server");
      await logActivityAs(userId, "play_episode", { episode_id: episode.id, series_id: episode.series_id });
      return {
        status: "allowed",
        url,
        expiresAt: Date.now() + PLAYBACK_LINK_TTL_SECONDS * 1000,
        contentType: media.content_type,
      };
    } catch (err) {
      console.error("Playback link failed", err);
      return { status: "not_configured" };
    }
  });
