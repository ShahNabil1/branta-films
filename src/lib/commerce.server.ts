import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { normaliseCart, quoteCart, type Coupon, type PricedItem, type CartItemType } from "./cart-pricing";

type Admin = SupabaseClient<Database>;
export type CartRequestItem = { type: CartItemType; id: string };

type CouponRow = Database["public"]["Tables"]["coupons"]["Row"] & { coupon_targets: { target_type: string; target_id: string }[] };

function toCoupon(r: CouponRow): Coupon {
  return {
    id: r.id, code: r.code, name: r.name, discount_type: r.discount_type as Coupon["discount_type"],
    discount_value: Number(r.discount_value), cap_amount: r.cap_amount == null ? null : Number(r.cap_amount),
    min_spend: Number(r.min_spend), applies_to: r.applies_to as Coupon["applies_to"], auto_apply: r.auto_apply,
    targets: r.coupon_targets.map((t) => ({ target_type: t.target_type as CartItemType, target_id: t.target_id })),
  };
}

/** Why a coupon cannot be used right now, or null when it can. */
async function couponBlock(sb: Admin, r: CouponRow, userId: string | null) {
  const now = Date.now();
  if (r.deleted_at || !r.is_active) return "This coupon is not active.";
  if (r.starts_at && new Date(r.starts_at).getTime() > now) return "This coupon has not started yet.";
  if (r.ends_at && new Date(r.ends_at).getTime() <= now) return "This coupon has expired.";
  if (r.max_uses_total != null) {
    const { data } = await sb.rpc("coupon_use_count", { _coupon: r.id });
    if ((data ?? 0) >= r.max_uses_total) return "This coupon has reached its usage limit.";
  }
  if (r.max_uses_per_customer != null && userId) {
    const { data } = await sb.rpc("coupon_use_count", { _coupon: r.id, _user: userId });
    if ((data ?? 0) >= r.max_uses_per_customer) return "You have already used this coupon.";
  }
  return null;
}

/** Auto-apply offers currently valid (optionally for one viewer's usage limits). */
export async function loadAutoOffers(sb: Admin, userId: string | null) {
  const { data, error } = await sb.from("coupons").select("*, coupon_targets(target_type, target_id)").eq("auto_apply", true).eq("is_active", true).is("deleted_at", null);
  if (error) throw new Error("Could not load offers.");
  const out: Coupon[] = [];
  for (const r of (data ?? []) as CouponRow[]) if (!(await couponBlock(sb, r, userId))) out.push(toCoupon(r));
  return out;
}

/**
 * Re-prices a cart entirely from database values: catalogue prices, what the
 * viewer already owns or has pending, and coupon rules/limits.
 */
export async function buildServerQuote(sb: Admin, userId: string, request: CartRequestItem[], code: string | null) {
  const seriesIds = [...new Set(request.filter((i) => i.type === "series").map((i) => i.id))];
  const episodeIds = [...new Set(request.filter((i) => i.type === "episode").map((i) => i.id))];
  const [{ data: series }, { data: episodes }, { data: ownedSeries }, { data: ownedEpisodes }, { data: pending }] = await Promise.all([
    seriesIds.length ? sb.from("series").select("id, title, price_bdt, is_published").in("id", seriesIds) : Promise.resolve({ data: [] as { id: string; title: string; price_bdt: number; is_published: boolean }[] }),
    episodeIds.length ? sb.from("episodes").select("id, series_id, title, episode_number, price_bdt, is_free, is_published, series:series_id(title, is_published)").in("id", episodeIds) : Promise.resolve({ data: [] as never[] }),
    sb.from("series_unlocks").select("series_id").eq("user_id", userId),
    sb.from("episode_unlocks").select("episode_id").eq("user_id", userId),
    sb.from("order_items").select("item_type, item_id, orders!inner(user_id, status)").eq("orders.user_id", userId).eq("orders.status", "pending"),
  ]);
  const ownS = new Set((ownedSeries ?? []).map((r) => r.series_id));
  const ownE = new Set((ownedEpisodes ?? []).map((r) => r.episode_id));
  const pend = new Set((pending ?? []).map((r) => `${r.item_type}:${r.item_id}`));
  const problems: { type: CartItemType; id: string; reason: string }[] = [];
  const items: PricedItem[] = [];
  for (const req of request) {
    if (req.type === "series") {
      const s = (series ?? []).find((x) => x.id === req.id);
      if (!s || !s.is_published || s.price_bdt <= 0) { problems.push({ ...req, reason: "No longer for sale." }); continue; }
      if (ownS.has(s.id)) { problems.push({ ...req, reason: "You already own this series." }); continue; }
      if (pend.has(`series:${s.id}`)) { problems.push({ ...req, reason: "Payment for this is awaiting verification." }); continue; }
      items.push({ type: "series", id: s.id, seriesId: null, title: s.title, price: s.price_bdt });
    } else {
      const e = (episodes ?? []).find((x) => x.id === req.id) as { id: string; series_id: string; title: string; episode_number: number; price_bdt: number | null; is_free: boolean; is_published: boolean; series: { title: string; is_published: boolean } | null } | undefined;
      if (!e || !e.is_published || !e.series?.is_published || e.is_free || !e.price_bdt || e.price_bdt <= 0) { problems.push({ ...req, reason: "This episode cannot be bought separately." }); continue; }
      if (ownS.has(e.series_id) || ownE.has(e.id)) { problems.push({ ...req, reason: "You already own this episode." }); continue; }
      if (pend.has(`episode:${e.id}`) || pend.has(`series:${e.series_id}`)) { problems.push({ ...req, reason: "Payment for this is awaiting verification." }); continue; }
      items.push({ type: "episode", id: e.id, seriesId: e.series_id, title: `${e.series.title} · Ep ${e.episode_number}: ${e.title}`, price: e.price_bdt });
    }
  }
  const clean = normaliseCart(items);
  const auto = await loadAutoOffers(sb, userId);
  let manual: Coupon | null = null;
  let codeError: string | null = null;
  if (code) {
    const { data: row } = await sb.from("coupons").select("*, coupon_targets(target_type, target_id)").eq("code", code).maybeSingle();
    if (!row) codeError = "This coupon code is not valid.";
    else {
      codeError = await couponBlock(sb, row as CouponRow, userId);
      if (!codeError) manual = toCoupon(row as CouponRow);
    }
  }
  const quote = quoteCart(clean, auto, manual);
  return { ...quote, manualError: codeError ?? quote.manualError, problems };
}
