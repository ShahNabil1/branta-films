import { describe, expect, it } from "vitest";
import { featuredSlides, firstHeroPreload, needsAuthPreconnect, needsBanglaFont } from "@/lib/catalog-loading";
import { artworkSources } from "@/lib/media";

describe("Critical resource hints", () => {
  const rows = [
    { is_featured: false, backdrop_url: "images/series/other/backdrop.webp", poster_url: null },
    { is_featured: true, backdrop_url: "images/series/first/backdrop.webp", poster_url: null },
  ];
  it("preloads exactly the first rendered slide and identical responsive candidates", () => {
    const slides = featuredSlides(rows);
    const links = firstHeroPreload(rows);
    expect(slides[0]?.backdrop_url).toBe("images/series/first/backdrop.webp");
    expect(links).toHaveLength(1);
    expect(links[0]?.href).toBe(artworkSources("images/series/first/backdrop.webp", "backdrop").src);
    expect(links[0]?.imageSrcSet).toBe(artworkSources("images/series/first/backdrop.webp", "backdrop").srcSet);
    expect(links[0]?.imageSizes).toBe("100vw");
    expect(firstHeroPreload([])).toEqual([]);
  });
  it("only requests the Bangla font when catalogue text needs it", () => {
    expect(needsBanglaFont([{ title: "River song", genres: ["Drama"] }])).toBe(false);
    expect(needsBanglaFont([{ title: "নদীর গান", genres: ["Drama"] }])).toBe(true);
  });
  it("limits auth connection hints to auth and private surfaces", () => {
    for (const path of ["/auth", "/forgot-password", "/account", "/account/explore", "/admin/users", "/checkout"]) expect(needsAuthPreconnect(path)).toBe(true);
    for (const path of ["/", "/browse", "/series/story", "/privacy", "/accounting"]) expect(needsAuthPreconnect(path)).toBe(false);
  });
});