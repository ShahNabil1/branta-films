import { z } from "zod";
import { absoluteMediaUrl } from "./media";
import { richTextToPlain } from "./rich-text";

export const SITE_URL = "https://films.brantatech.com";
export const SITE_TITLE = "Branta Films — AI-Generated Web Series OTT";
export const SITE_DESCRIPTION = "Discover curated AI-generated web series on Branta Films by Branta Tech — home to Bangladesh's first complete AI-generated web series and its OTT platform.";
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional().transform(v => v || null);
export const seoFields = (kind: "series" | "episodes") => ({
  meta_title: optionalText(200), meta_description: optionalText(500),
  og_title: optionalText(200), og_description: optionalText(500),
  og_image: z.string().regex(new RegExp(`^images/${kind}/[\\w\\-./]+\\.(webp|png|jpe?g)$`, "i")).refine(v => !v.includes(".."), "Invalid image key").nullable().optional().transform(v => v || null),
});
export interface SeoOverrides { meta_title?: string | null; meta_description?: string | null; og_title?: string | null; og_description?: string | null; og_image?: string | null }
export interface SeoContent extends SeoOverrides { title: string; description_html?: string; synopsis_html?: string; tagline?: string; poster_url?: string | null; backdrop_url?: string | null; thumbnail_url?: string | null }
export function contentSeo(content: SeoContent, episode?: { seriesTitle: string; number: number; fallbackImage?: string | null }) {
  const defaultTitle = episode ? `${content.title} — Episode ${episode.number} · ${episode.seriesTitle} — Branta Films` : `${content.title} — AI-Generated Series | Branta Films`;
  const plain = richTextToPlain(content.description_html ?? content.synopsis_html).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const defaultDescription = (plain || content.tagline || (episode ? `Watch episode ${episode.number} of ${episode.seriesTitle}, an AI-generated web series on Branta Films.` : `Discover ${content.title}, an AI-generated web series on Branta Films.`)).slice(0, 160);
  const title = content.meta_title?.trim() || defaultTitle;
  const description = content.meta_description?.trim() || defaultDescription;
  return { title, description, ogTitle: content.og_title?.trim() || title, ogDescription: content.og_description?.trim() || description,
    image: absoluteMediaUrl(content.og_image || content.thumbnail_url || content.backdrop_url || content.poster_url || episode?.fallbackImage), defaultTitle, defaultDescription };
}
export function seoHead(seo: ReturnType<typeof contentSeo>, path: string, type = "video.tv_show", noindex = false) {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [{ title: seo.title }, { name: "description", content: seo.description }, { property: "og:title", content: seo.ogTitle }, { property: "og:description", content: seo.ogDescription }, { property: "og:type", content: type }, { property: "og:url", content: url }, { name: "twitter:card", content: seo.image ? "summary_large_image" : "summary" }, { name: "twitter:title", content: seo.ogTitle }, { name: "twitter:description", content: seo.ogDescription }, ...(seo.image ? [{ property: "og:image", content: seo.image }, { name: "twitter:image", content: seo.image }, { property: "og:image:alt", content: seo.ogTitle }] : []), ...(noindex ? [{ name: "robots", content: "noindex" }] : [])],
    links: [{ rel: "canonical", href: url }],
  };
}
export function jsonLd(value: unknown) { return { type: "application/ld+json", children: JSON.stringify(value).replace(/</g, "\\u003c") }; }