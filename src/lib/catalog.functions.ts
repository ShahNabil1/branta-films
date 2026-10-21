import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const SERIES_FIELDS =
  "id, slug, title, tagline, description_html, poster_url, backdrop_url, genres, release_year, maturity_rating, price_bdt, is_featured, sort_order";

export type CatalogSeries = Database["public"]["Tables"]["series"]["Row"] & {
  episodes: { id: string; is_free: boolean }[];
};

export const listCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("series")
    .select(`${SERIES_FIELDS}, episodes(id, is_free)`)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CatalogSeries[];
});

export const getSeriesBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: series, error } = await sb
      .from("series")
      .select(
        `${SERIES_FIELDS}, episodes(id, episode_number, title, synopsis_html, duration_seconds, thumbnail_url, is_free)`,
      )
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!series) return null;
    const episodes = [...(series.episodes ?? [])].sort((a, b) => a.episode_number - b.episode_number);
    return { ...series, episodes };
  });
