import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAccountAccess } from "./security-middleware";
import { BD_PHONE_RE, TRX_ID_RE, maskCouponCode } from "./cart-pricing";

const cartItems = z.array(z.object({ type: z.enum(["series", "episode"]), id: z.string().uuid() })).min(1).max(50);
const codeField = z.string().max(40).nullable().optional().transform((v) => (v ? maskCouponCode(v) || null : null));

/** Public: auto-apply offers so catalogue pages can show sale prices. */
export const listOffers = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { loadAutoOffers } = await import("./commerce.server");
  try { return await loadAutoOffers(supabaseAdmin, null); } catch { return []; }
});

export const quoteMyCart = createServerFn({ method: "POST" }).middleware([requireAccountAccess])
  .inputValidator((input: unknown) => z.object({ items: cartItems, code: codeField }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { buildServerQuote } = await import("./commerce.server");
    return buildServerQuote(supabaseAdmin, context.userId, data.items, data.code ?? null);
  });

export const getPaymentNumbers = createServerFn({ method: "POST" }).middleware([requireAccountAccess]).handler(async ({ context }) => {
  const { data } = await context.supabase.from("payment_settings").select("bkash, nagad, rocket, instructions").maybeSingle();
  return data ?? { bkash: "", nagad: "", rocket: "", instructions: "" };
});

export const placeOrder = createServerFn({ method: "POST" }).middleware([requireAccountAccess])
  .inputValidator((input: unknown) => z.object({
    items: cartItems, code: codeField,
    method: z.enum(["bkash", "nagad", "rocket"]),
    sender_phone: z.string().trim().transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?88/, "")).refine((v) => BD_PHONE_RE.test(v), "Enter the 11-digit number you paid from."),
    trx_id: z.string().trim().transform((v) => v.toUpperCase()).refine((v) => TRX_ID_RE.test(v), "Enter the Transaction ID exactly as shown in your payment SMS."),
    expected_total: z.number().int().min(0),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { buildServerQuote } = await import("./commerce.server");
    const { data: numbers } = await sb.from("payment_settings").select("*").maybeSingle();
    if (!numbers?.[data.method]) throw new Error("This payment method is not available right now.");
    const q = await buildServerQuote(sb, context.userId, data.items, data.code ?? null);
    if (q.problems.length) throw new Error(q.problems[0]!.reason);
    if (q.lines.length === 0) throw new Error("Your cart is empty.");
    if (data.code && q.manualError) throw new Error(q.manualError);
    if (q.total !== data.expected_total) throw new Error("Prices changed — please review your cart total and try again.");
    if (q.total <= 0) throw new Error("Free items do not need a payment.");
    const { data: order, error } = await sb.from("orders").insert({
      user_id: context.userId, subtotal_bdt: q.subtotal, discount_bdt: q.discount, total_bdt: q.total,
      coupon_code: q.appliedLabel, method: data.method, sender_phone: data.sender_phone, trx_id: data.trx_id, paid_to: numbers[data.method],
    }).select("id").single();
    if (error) throw new Error(error.code === "23505" ? "This Transaction ID has already been submitted." : "Could not submit your payment. Please try again.");
    const { error: itemsError } = await sb.from("order_items").insert(q.lines.map((l) => ({
      order_id: order.id, item_type: l.type, item_id: l.id, title: l.title, unit_price_bdt: l.price, discount_bdt: l.discount, final_price_bdt: l.final, coupon_id: l.couponId,
    })));
    if (itemsError) { await sb.from("orders").delete().eq("id", order.id); throw new Error("Could not submit your payment. Please try again."); }
    return { id: order.id, total: q.total };
  });

export const listMyOrders = createServerFn({ method: "POST" }).middleware([requireAccountAccess]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("orders")
    .select("id, status, subtotal_bdt, discount_bdt, total_bdt, coupon_code, method, trx_id, reject_reason, created_at, order_items(item_type, item_id, title, final_price_bdt, discount_bdt)")
    .eq("user_id", context.userId).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Could not load your orders.");
  return data ?? [];
});
