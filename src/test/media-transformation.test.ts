import { describe, expect, it } from "vitest";
import { mediaCacheControl, transformedMediaUrl } from "@/lib/media";

describe("Cloudflare artwork delivery", () => {
  it("uses the enabled zone and bounded width with automatic format", () => {
    expect(transformedMediaUrl("images/series/show/poster.webp", 480)).toBe("https://films.brantatech.com/cdn-cgi/image/width=480,fit=scale-down,quality=80,format=auto/api/public/media/images/series/show/poster.webp");
  });
  it("does not expose private video or transform external and avatar sources", () => {
    for (const path of ["videos/episodes/x.mp4", "images/avatars/u/1.webp", "https://example.com/a.jpg", "images/series/../x.webp"]) {
      expect(transformedMediaUrl(path, 480)).toBeNull();
    }
  });
  it("rejects unbounded transformation sizes", () => {
    expect(transformedMediaUrl("images/series/show/poster.webp", 481)).toBeNull();
  });
  it("sets public artwork browser caching to exactly one year", () => {
    expect(mediaCacheControl("images/series/show/poster.webp")).toBe("public, max-age=31536000, immutable");
    expect(mediaCacheControl("images/episodes/show/thumbnail.webp")).toBe("public, max-age=31536000, immutable");
  });
  it("keeps avatars out of one-year caching", () => {
    expect(mediaCacheControl("images/avatars/u/1.webp")).toBe("public, max-age=86400, stale-while-revalidate=604800");
  });
});