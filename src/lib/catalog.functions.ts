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
  /** Sale price from the best automatic coupon, or null when not discounted. */
  discount_price_bdt: number | null;
  episodes: { id: string; is_free: boolean }[];
};

/** Adds the automatic-offer sale price for a series and each of its episodes. */
type Ep<T> = T extends { episodes?: (infer E)[] } ? E : never;
async function withOffers<T extends { id: string; price_bdt: number; episodes?: { id: string; price_bdt?: number | null }[] }>(rows: T[]): Promise<(Omit<T, "episodes"> & { discount_price_bdt: number | null; episodes: (Ep<T> & { sale_price_bdt: number | null })[] })[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { loadAutoOffers } = await import("./commerce.server");
  const { salePrice } = await import("./cart-pricing");
  const offers = await loadAutoOffers(supabaseAdmin, null).catch(() => []);
  const sale = (type: "series" | "episode", id: string, seriesId: string | null, price: number) => {
    if (price <= 0) return null;
    const p = salePrice({ type, id, seriesId, title: "", price }, offers);
    return p < price ? p : null;
  };
  return rows.map((s) => ({
    ...s,
    discount_price_bdt: sale("series", s.id, null, s.price_bdt),
    episodes: (s.episodes ?? []).map((e) => ({ ...e, sale_price_bdt: e.price_bdt ? sale("episode", e.id, s.id, e.price_bdt) : null })) as (Ep<T> & { sale_price_bdt: number | null })[],
  }));
}

export const listCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("series")
    .select(`${SERIES_FIELDS}, episodes(id, is_free)`)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (await withOffers((data ?? []) as unknown as CatalogSeries[])) as unknown as CatalogSeries[];
});

export const getSeriesBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: series, error } = await sb
      .from("series")
      .select(
        `${SERIES_FIELDS}, episodes(id, episode_number, title, synopsis_html, duration_seconds, thumbnail_url, is_free, price_bdt)`,
      )
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!series) return null;
    const [priced] = await withOffers([{ ...series, episodes: [...(series.episodes ?? [])].sort((a, b) => a.episode_number - b.episode_number) }]);
    return priced!;
  });
