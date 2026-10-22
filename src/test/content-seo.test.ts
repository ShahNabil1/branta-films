import { describe, expect, it } from "vitest";
import { z } from "zod";
import { contentSeo, seoFields, seoHead, jsonLd } from "../lib/content-seo";

describe("automatic content metadata and optional overrides", () => {
  it("derives series title from the name when no override exists", () => {
    expect(contentSeo({ title: "Neon Rain" }).title).toBe("Neon Rain — AI-Generated Series | Branta Films");
  });
  it("derives plain description from content before tagline", () => {
    expect(contentSeo({ title: "Neon Rain", description_html: "<p>Rain &amp; memories.</p>", tagline: "Other text" }).description).toBe("Rain & memories.");
  });
  it("bounds only automatic descriptions to 160 characters", () => {
    expect(contentSeo({ title: "Series", description_html: "a".repeat(180) }).description).toHaveLength(160);
  });
  it("includes parent and episode number in automatic episode title", () => {
    expect(contentSeo({ title: "Arrival" }, { seriesTitle: "Neon Rain", number: 3 }).title).toBe("Arrival — Episode 3 · Neon Rain — Branta Films");
  });
  it("prefers meta overrides and lets independent OG overrides win", () => {
    const seo = contentSeo({ title: "Series", meta_title: "Search title", meta_description: "Search details", og_title: "Share title", og_description: "Share details" });
    expect([seo.title, seo.description, seo.ogTitle, seo.ogDescription]).toEqual(["Search title", "Search details", "Share title", "Share details"]);
  });
  it("uses thumbnail automatically and a chosen OG image first", () => {
    const content = { title: "Episode", thumbnail_url: "images/episodes/a/thumbnail.webp" };
    expect(contentSeo(content).image).toBe("https://films.brantatech.com/api/public/media/images/episodes/a/thumbnail.webp");
    expect(contentSeo({ ...content, og_image: "images/episodes/a/ogImage.webp" }).image).toBe("https://films.brantatech.com/api/public/media/images/episodes/a/ogImage.webp");
  });
  it("treats blank overrides as automatic, including when saving", () => {
    const schema = z.object(seoFields("series"));
    expect(schema.parse({ meta_title: "  " }).meta_title).toBeNull();
    expect(contentSeo({ title: "Series", meta_title: " " }).title).toBe("Series — AI-Generated Series | Branta Films");
  });
  it("rejects private video keys and traversal in OG image fields", () => {
    const schema = z.object(seoFields("episodes"));
    expect(schema.safeParse({ og_image: "videos/episodes/a.mp4" }).success).toBe(false);
    expect(schema.safeParse({ og_image: "images/episodes/../a.webp" }).success).toBe(false);
    expect(schema.safeParse({ og_image: "images/episodes/a/ogImage.webp" }).success).toBe(true);
  });
  it("self-references canonical and OG URL", () => {
    const head = seoHead(contentSeo({ title: "Series" }), "/series/neon-rain");
    expect(head.links[0]?.href).toBe("https://films.brantatech.com/series/neon-rain");
    expect(head.meta.find(m => "property" in m && m.property === "og:url")?.content).toBe("https://films.brantatech.com/series/neon-rain");
  });
  it("escapes HTML script delimiters in structured data", () => {
    expect(jsonLd({ name: "</script>" }).children).not.toContain("</script>");
    expect(JSON.parse(jsonLd({ name: "</script>" }).children).name).toBe("</script>");
  });
});