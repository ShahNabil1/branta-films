/**
 * Cart pricing — the single rule deciding what a viewer pays. Used by the
 * browser for display and re-run on the server from database values before
 * any order is stored, so the browser can never set its own price.
 */
export type CartItemType = "series" | "episode";

export type PricedItem = {
  type: CartItemType;
  id: string;
  /** For episodes: the series they belong to (a series offer also covers its episodes). */
  seriesId: string | null;
  title: string;
  price: number;
};

export type Coupon = {
  id: string;
  code: string;
  name: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  cap_amount: number | null;
  min_spend: number;
  applies_to: "all" | "series" | "episodes";
  auto_apply: boolean;
  targets: { target_type: CartItemType; target_id: string }[];
};

export type LineResult = PricedItem & { discount: number; final: number; couponId: string | null; couponCode: string | null };

export type CartQuote = {
  lines: LineResult[];
  subtotal: number;
  discount: number;
  total: number;
  /** One label for the whole cart, however many offers were used. */
  appliedLabel: string | null;
  /** Code the viewer typed, when it improved at least one line. */
  manualCode: string | null;
  manualError: string | null;
};

export function couponCovers(c: Coupon, item: PricedItem) {
  if (c.applies_to === "all") return true;
  return c.targets.some((t) =>
    (t.target_type === item.type && t.target_id === item.id) ||
    (item.type === "episode" && t.target_type === "series" && t.target_id === item.seriesId));
}

/** Whole-taka discount a coupon gives one line on its own (cap applied per line for auto offers). */
export function lineDiscount(c: Coupon, price: number) {
  if (price <= 0) return 0;
  const raw = c.discount_type === "percent" ? (price * c.discount_value) / 100 : c.discount_value;
  const capped = c.cap_amount != null ? Math.min(raw, c.cap_amount) : raw;
  return Math.max(0, Math.min(price, Math.round(capped)));
}

/**
 * Applies a typed coupon across the lines it covers: percent per line, a flat
 * amount split by price, and the cap limiting the coupon's total.
 */
function manualDiscounts(c: Coupon, lines: PricedItem[]) {
  const eligible = lines.filter((l) => couponCovers(c, l) && l.price > 0);
  const base = eligible.reduce((s, l) => s + l.price, 0);
  const out = new Map<string, number>();
  if (base === 0) return { out, base };
  let total = c.discount_type === "percent" ? (base * c.discount_value) / 100 : c.discount_value;
  if (c.cap_amount != null) total = Math.min(total, c.cap_amount);
  total = Math.min(base, Math.round(total));
  let given = 0;
  eligible.forEach((l, i) => {
    const share = i === eligible.length - 1 ? total - given : Math.floor((total * l.price) / base);
    given += share;
    out.set(`${l.type}:${l.id}`, share);
  });
  return { out, base };
}

/**
 * Prices a cart. Each line gets the single best offer for it (auto offer or
 * typed code) — offers never stack on one line, and an offer only lowers the
 * lines it targets, never the whole cart.
 */
export function quoteCart(items: PricedItem[], autoOffers: Coupon[], manual: Coupon | null): CartQuote {
  const keyOf = (l: PricedItem) => `${l.type}:${l.id}`;
  let manualError: string | null = null;
  let manualMap = new Map<string, number>();
  if (manual) {
    const { out, base } = manualDiscounts(manual, items);
    if (base === 0) manualError = "This coupon does not apply to the items in your cart.";
    else if (base < manual.min_spend) manualError = `Spend at least ৳${manual.min_spend} on eligible items to use this coupon.`;
    else manualMap = out;
  }
  let manualUsed = false;
  const lines: LineResult[] = items.map((item) => {
    let best = { discount: 0, coupon: null as Coupon | null };
    for (const c of autoOffers) {
      if (!c.auto_apply || c.min_spend > 0 || !couponCovers(c, item)) continue;
      const d = lineDiscount(c, item.price);
      if (d > best.discount) best = { discount: d, coupon: c };
    }
    const m = manualMap.get(keyOf(item)) ?? 0;
    if (manual && m > best.discount) { best = { discount: m, coupon: manual }; manualUsed = true; }
    return { ...item, discount: best.discount, final: item.price - best.discount, couponId: best.coupon?.id ?? null, couponCode: best.coupon?.code ?? null };
  });
  if (manual && !manualError && !manualUsed) manualError = "Your items already have a better offer applied.";
  const subtotal = lines.reduce((s, l) => s + l.price, 0);
  const discount = lines.reduce((s, l) => s + l.discount, 0);
  const codes = [...new Set(lines.filter((l) => l.couponCode).map((l) => l.couponCode as string))];
  const discounted = lines.filter((l) => l.discount > 0).length;
  const appliedLabel = discount === 0 ? null : manualUsed && codes.length === 1 ? manual!.code
    : codes.length === 1 ? codes[0]! : `${discounted} offers`;
  return { lines, subtotal, discount, total: subtotal - discount, appliedLabel, manualCode: manualUsed ? manual!.code : null, manualError };
}

/** Removes duplicates and episodes already covered by a series in the same cart. */
export function normaliseCart<T extends { type: CartItemType; id: string; seriesId: string | null }>(items: T[]): T[] {
  const seen = new Set<string>();
  const seriesInCart = new Set(items.filter((i) => i.type === "series").map((i) => i.id));
  return items.filter((i) => {
    const k = `${i.type}:${i.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return !(i.type === "episode" && i.seriesId && seriesInCart.has(i.seriesId));
  });
}

/** Best automatic sale price for one item on its own, for catalogue display. */
export function salePrice(item: PricedItem, autoOffers: Coupon[]) {
  return quoteCart([item], autoOffers, null).lines[0]!.final;
}

export const TRX_ID_RE = /^[A-Z0-9]{6,20}$/;
export const BD_PHONE_RE = /^01[3-9]\d{8}$/;
export const COUPON_CODE_RE = /^[A-Z0-9]{3,24}$/;
export const maskCouponCode = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 24);
