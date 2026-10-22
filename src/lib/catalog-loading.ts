import { artworkSources } from "./media";

type FeaturedArtwork = { is_featured: boolean; backdrop_url: string | null; poster_url: string | null };

export function featuredSlides<T extends FeaturedArtwork>(catalog: T[]): T[] {
  return [...catalog].sort((a, b) => Number(b.is_featured) - Number(a.is_featured)).slice(0, 5);
}

export function firstHeroPreload(catalog: FeaturedArtwork[]) {
  const first = featuredSlides(catalog)[0];
  const path = first?.backdrop_url ?? first?.poster_url;
  if (!path) return [];
  const source = artworkSources(path, "backdrop");
  if (!source.src) return [];
  return [{ rel: "preload", as: "image", href: source.src, imageSrcSet: source.srcSet, imageSizes: source.srcSet ? "100vw" : undefined, fetchPriority: "high" as const }];
}

export function needsBanglaFont(catalog: { title: string; tagline?: string | null; genres: string[] }[]): boolean {
  return catalog.some(item => /[\u0980-\u09ff]/.test([item.title, item.tagline, ...item.genres].join(" ")));
}

/** No same-origin preconnect: the document connection is already established. */
export function needsAuthPreconnect(pathname: string): boolean {
  return ["/auth", "/forgot-password", "/set-password", "/checkout"].includes(pathname)
    || pathname === "/account" || pathname.startsWith("/account/")
    || pathname === "/admin" || pathname.startsWith("/admin/");
}