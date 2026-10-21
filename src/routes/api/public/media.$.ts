import { createFileRoute } from "@tanstack/react-router";
import { isAllowedMediaPath } from "@/lib/media";

// Serves series artwork and avatars from the private R2 bucket (images/ folder only).
// Video files are never served here — they get short-lived links after an access check.
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = decodeURIComponent(params._splat ?? "");
        if (!isAllowedMediaPath(path)) return new Response("Not found", { status: 404 });
        const { r2GetObject } = await import("@/lib/r2.server");
        const obj = await r2GetObject(path).catch(() => null);
        if (!obj) return new Response("Not found", { status: 404 });
        return new Response(obj.body, {
          headers: {
            "content-type": obj.headers.get("content-type") || "application/octet-stream",
            "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});
