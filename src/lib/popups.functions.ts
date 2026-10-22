import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type PublicPopup = {
  id: string; title: string; image: string; alt: string; placement: "site" | "dashboard" | "everywhere";
  delay_seconds: number; frequency: "session" | "once" | "every_visit"; updated_at: string;
  action: { kind: "none" } | { kind: "url"; url: string } | { kind: "cart"; item: { type: "series" | "episode"; id: string; seriesId: string | null; title: string; price: number; image: string | null } };
};

/** Public: popups currently scheduled to show, with their click action resolved. */
export const listActivePopups = createServerFn({ method: "GET" }).handler(async (): Promise<PublicPopup[]> => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
  });
  const { data, error } = await sb.from("popups").select("*").eq("is_active", true).order("sort_order").order("delay_seconds");
  if (error) return [];
  const now = Date.now();
  const rows = (data ?? []).filter((p) => p.image_key && (!p.starts_at || new Date(p.starts_at).getTime() <= now) && (!p.ends_at || new Date(p.ends_at).getTime() > now));
  const seriesIds = rows.filter((p) => p.action_type === "series" && p.action_target).map((p) => p.action_target!);
  const episodeIds = rows.filter((p) => p.action_type === "episode" && p.action_target).map((p) => p.action_target!);
  const [{ data: series }, { data: episodes }] = await Promise.all([
    seriesIds.length ? sb.from("series").select("id, title, price_bdt, poster_url").in("id", seriesIds) : Promise.resolve({ data: [] as { id: string; title: string; price_bdt: number; poster_url: string | null }[] }),
    episodeIds.length ? sb.from("episodes").select("id, series_id, episode_number, title, price_bdt, thumbnail_url, series:series_id(title)").in("id", episodeIds) : Promise.resolve({ data: [] as never[] }),
  ]);
  return rows.flatMap((p): PublicPopup[] => {
    let action: PublicPopup["action"] = { kind: "none" };
    if (p.action_type === "url" && p.action_url) action = { kind: "url", url: p.action_url };
    if (p.action_type === "series") {
      const s = (series ?? []).find((x) => x.id === p.action_target);
      if (!s || s.price_bdt <= 0) return [];
      action = { kind: "cart", item: { type: "series", id: s.id, seriesId: null, title: `${s.title} — full series`, price: s.price_bdt, image: s.poster_url } };
    }
    if (p.action_type === "episode") {
      const e = (episodes ?? []).find((x: { id: string }) => x.id === p.action_target) as { id: string; series_id: string; episode_number: number; title: string; price_bdt: number | null; thumbnail_url: string | null; series: { title: string } | null } | undefined;
      if (!e || !e.price_bdt) return [];
      action = { kind: "cart", item: { type: "episode", id: e.id, seriesId: e.series_id, title: `${e.series?.title ?? ""} · Ep ${e.episode_number}: ${e.title}`, price: e.price_bdt, image: e.thumbnail_url } };
    }
    return [{ id: p.id, title: p.title, image: p.image_key!, alt: p.alt || p.title, placement: p.placement as PublicPopup["placement"], delay_seconds: p.delay_seconds, frequency: p.frequency as PublicPopup["frequency"], updated_at: p.updated_at, action }];
  });
});
