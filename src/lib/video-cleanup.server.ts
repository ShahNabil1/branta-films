import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { r2DeleteObject } from "./r2.server";

/** Trigger-backed durable queue: failed R2 deletes remain retryable on the next admin visit. */
export async function flushVideoCleanup(): Promise<boolean> {
  const { data: queued, error } = await supabaseAdmin.from("video_cleanup_queue")
    .select("video_key, attempts").order("created_at").limit(100);
  if (error) return true;
  let pending = false;
  for (const item of queued ?? []) {
    try {
      if (!item.video_key.startsWith("videos/")) throw new Error("Invalid cleanup key.");
      const { data: active, error: activeError } = await supabaseAdmin.from("episode_media")
        .select("episode_id").eq("video_key", item.video_key).limit(1);
      if (activeError) throw activeError;
      // Never delete a file still referenced by any episode.
      if (active?.length) { pending = true; continue; }
      await r2DeleteObject(item.video_key);
      const { error: removeError } = await supabaseAdmin.from("video_cleanup_queue").delete().eq("video_key", item.video_key);
      if (removeError) throw removeError;
    } catch {
      pending = true;
      await supabaseAdmin.from("video_cleanup_queue").update({ attempts: item.attempts + 1 }).eq("video_key", item.video_key);
    }
  }
  return pending || (queued?.length ?? 0) === 100;
}