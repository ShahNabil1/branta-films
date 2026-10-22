import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-middleware";
import { COUPON_CODE_RE, maskCouponCode } from "./cart-pricing";

const id = z.string().uuid();

export const listAdminOrders = createServerFn({ method: "POST" }).middleware([requireAdmin]).handler(async () => {
  const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
  const { data, error } = await sb.from("orders")
    .select("*, order_items(item_type, item_id, title, unit_price_bdt, discount_bdt, final_price_bdt)")
    .order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error("Could not load orders.");
  const users = [...new Set((data ?? []).map((o) => o.user_id))];
  const { data: profiles } = users.length ? await sb.from("profiles").select("id, full_name, email").in("id", users) : { data: [] };
  const { data: settings } = await sb.from("payment_settings").select("*").maybeSingle();
  return { orders: (data ?? []).map((o) => ({ ...o, profile: (profiles ?? []).find((p) => p.id === o.user_id) ?? null })), settings };
});

export const reviewAdminOrder = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ id, approve: z.boolean(), reason: z.string().trim().max(300).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { data: order } = await sb.from("orders").select("id, user_id, status, order_items(item_type, item_id)").eq("id", data.id).maybeSingle();
    if (!order) throw new Error("Order not found.");
    if (order.status !== "pending") throw new Error("This order has already been reviewed.");
    if (!data.approve && !data.reason) throw new Error("Give the viewer a reason for the rejection.");
    if (data.approve) {
      const series = order.order_items.filter((i) => i.item_type === "series").map((i) => ({ user_id: order.user_id, series_id: i.item_id, source: "manual_payment", payment_id: order.id, granted_by: context.userId }));
      const episodes = order.order_items.filter((i) => i.item_type === "episode").map((i) => ({ user_id: order.user_id, episode_id: i.item_id, source: "manual_payment", order_id: order.id, granted_by: context.userId }));
      if (series.length) { const { error } = await sb.from("series_unlocks").upsert(series, { onConflict: "user_id,series_id" }); if (error) throw new Error("Could not unlock the series."); }
      if (episodes.length) { const { error } = await sb.from("episode_unlocks").upsert(episodes, { onConflict: "user_id,episode_id" }); if (error) throw new Error("Could not unlock the episodes."); }
    }
    const { error } = await sb.from("orders").update({ status: data.approve ? "approved" : "rejected", reject_reason: data.approve ? null : data.reason ?? null, reviewed_by: context.userId, reviewed_at: new Date().toISOString() }).eq("id", order.id).eq("status", "pending");
    if (error) throw new Error("Could not update the order.");
    return { ok: true };
  });

const phone = z.string().trim().refine((v) => v === "" || /^01[3-9]\d{8}$/.test(v), "Use an 11-digit Bangladeshi number.");
export const saveAdminPaymentSettings = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ bkash: phone, nagad: phone, rocket: z.string().trim().max(14), instructions: z.string().trim().max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("payment_settings").update({ ...data, updated_at: new Date().toISOString() }).eq("id", true);
    if (error) throw new Error("Could not save payment numbers.");
    return { ok: true };
  });

// ---------------- Coupons ----------------
const couponSchema = z.object({
  id: id.nullable().optional(),
  code: z.string().transform(maskCouponCode).refine((v) => COUPON_CODE_RE.test(v), "Use 3-24 capital English letters or digits only."),
  name: z.string().trim().min(1).max(120), description: z.string().trim().max(500).nullable(),
  discount_type: z.enum(["percent", "flat"]), discount_value: z.number().positive(),
  cap_amount: z.number().positive().nullable(), min_spend: z.number().min(0),
  max_uses_total: z.number().int().positive().nullable(), max_uses_per_customer: z.number().int().positive().nullable(),
  applies_to: z.enum(["all", "series", "episodes"]), auto_apply: z.boolean(),
  starts_at: z.string().datetime().nullable(), ends_at: z.string().datetime().nullable(), is_active: z.boolean(),
  targets: z.array(z.object({ target_type: z.enum(["series", "episode"]), target_id: id })).max(500),
}).superRefine((c, ctx) => {
  if (c.discount_type === "percent" && c.discount_value > 100) ctx.addIssue({ code: "custom", message: "Percentage discount cannot exceed 100%." });
  if (c.applies_to !== "all" && c.targets.length === 0) ctx.addIssue({ code: "custom", message: "Select at least one target, or apply to everything." });
  if (c.auto_apply && c.applies_to === "all") ctx.addIssue({ code: "custom", message: "Automatic offers must target specific series or episodes." });
  if (c.auto_apply && c.min_spend > 0) ctx.addIssue({ code: "custom", message: "Automatic offers cannot have a minimum spend." });
  if (c.starts_at && c.ends_at && c.starts_at >= c.ends_at) ctx.addIssue({ code: "custom", message: "“Valid until” must be after “Valid from”." });
  const wanted = c.applies_to === "series" ? "series" : "episode";
  if (c.applies_to !== "all" && c.targets.some((t) => t.target_type !== wanted)) ctx.addIssue({ code: "custom", message: "Targets do not match “Applies to”." });
});

export const listAdminCoupons = createServerFn({ method: "POST" }).middleware([requireAdmin]).handler(async () => {
  const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
  const { data, error } = await sb.from("coupons").select("*, coupon_targets(target_type, target_id)").order("created_at", { ascending: false });
  if (error) throw new Error("Could not load coupons.");
  const rows = await Promise.all((data ?? []).map(async (c) => {
    const { data: uses } = await sb.rpc("coupon_use_count", { _coupon: c.id });
    return { ...c, discount_value: Number(c.discount_value), cap_amount: c.cap_amount == null ? null : Number(c.cap_amount), min_spend: Number(c.min_spend), uses_count: uses ?? 0, targets: c.coupon_targets };
  }));
  return rows;
});

export const saveAdminCoupon = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => couponSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { id: rowId, targets, ...values } = data;
    const query = rowId ? sb.from("coupons").update(values).eq("id", rowId) : sb.from("coupons").insert(values);
    const { data: row, error } = await query.select("id").single();
    if (error) throw new Error(error.code === "23505" ? "Another coupon already uses this code." : error.message);
    const { error: delError } = await sb.from("coupon_targets").delete().eq("coupon_id", row.id);
    if (delError) throw new Error("Could not update targets.");
    const list = data.applies_to === "all" ? [] : targets;
    if (list.length) { const { error: tErr } = await sb.from("coupon_targets").insert(list.map((t) => ({ ...t, coupon_id: row.id }))); if (tErr) throw new Error("Could not save targets."); }
    return { id: row.id };
  });

export const setAdminCouponState = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ id, action: z.enum(["activate", "deactivate", "delete", "restore"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const patch = data.action === "activate" ? { is_active: true } : data.action === "deactivate" ? { is_active: false } : data.action === "delete" ? { deleted_at: new Date().toISOString(), is_active: false } : { deleted_at: null };
    const { error } = await context.supabase.from("coupons").update(patch).eq("id", data.id);
    if (error) throw new Error("Could not update coupon.");
    return { ok: true };
  });

// ---------------- Popups ----------------
const popupSchema = z.object({
  id: id.nullable().optional(), title: z.string().trim().min(1).max(120),
  image_key: z.string().startsWith("images/popups/").nullable(), alt: z.string().trim().max(200),
  action_type: z.enum(["none", "url", "series", "episode"]), action_url: z.string().trim().max(500).nullable(), action_target: id.nullable(),
  placement: z.enum(["site", "dashboard", "everywhere"]), delay_seconds: z.number().int().min(0).max(600),
  frequency: z.enum(["session", "once", "every_visit"]), starts_at: z.string().datetime().nullable(), ends_at: z.string().datetime().nullable(),
  is_active: z.boolean(),
}).superRefine((p, ctx) => {
  if (p.action_type === "url" && !(p.action_url && (/^\/(?!\/)/.test(p.action_url) || /^https:\/\//.test(p.action_url)))) ctx.addIssue({ code: "custom", message: "Link must start with / or https://" });
  if ((p.action_type === "series" || p.action_type === "episode") && !p.action_target) ctx.addIssue({ code: "custom", message: "Choose what “Purchase now” adds to the cart." });
  if (p.is_active && !p.image_key) ctx.addIssue({ code: "custom", message: "Upload an image before activating." });
  if (p.starts_at && p.ends_at && p.starts_at >= p.ends_at) ctx.addIssue({ code: "custom", message: "“Show until” must be after “Show from”." });
});

export const listAdminPopups = createServerFn({ method: "POST" }).middleware([requireAdmin]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("popups").select("*").order("sort_order").order("delay_seconds");
  if (error) throw new Error("Could not load popups.");
  return data ?? [];
});

export const saveAdminPopup = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => popupSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { id: rowId, ...values } = data;
    const clean = { ...values, action_url: values.action_type === "url" ? values.action_url : null, action_target: values.action_type === "series" || values.action_type === "episode" ? values.action_target : null };
    const q = rowId ? context.supabase.from("popups").update(clean).eq("id", rowId) : context.supabase.from("popups").insert(clean);
    const { data: row, error } = await q.select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteAdminPopup = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ id }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase.from("popups").select("image_key").eq("id", data.id).maybeSingle();
    const { error } = await context.supabase.from("popups").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete popup.");
    if (row?.image_key) { try { const { r2DeleteObject } = await import("./r2.server"); await r2DeleteObject(row.image_key); } catch { /* best effort */ } }
    return { ok: true };
  });

export const uploadAdminPopupImage = createServerFn({ method: "POST" }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ contentType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().max(14000000) }).parse(input))
  .handler(async ({ data }) => {
    const { r2PutObject } = await import("./r2.server");
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[data.contentType];
    const key = `images/popups/${crypto.randomUUID()}.${ext}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    await r2PutObject(key, bytes.buffer, data.contentType);
    return { key };
  });
