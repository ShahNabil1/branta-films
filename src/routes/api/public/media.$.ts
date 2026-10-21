import { createFileRoute } from "@tanstack/react-router";
import { isAllowedMediaPath } from "@/lib/media";

// Serves poster and avatar images from the private media bucket.
// Video files are never served here — they live in private R2 storage.
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = decodeURIComponent(params._splat ?? "");
        if (!isAllowedMediaPath(path)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("media").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});
