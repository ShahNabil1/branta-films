import { describe, expect, it } from "vitest";
import { normaliseCart, quoteCart, type Coupon, type PricedItem } from "@/lib/cart-pricing";

const ep = (id: string, price = 30): PricedItem => ({ type: "episode", id, seriesId: "s1", title: id, price });
const coupon = (over: Partial<Coupon>): Coupon => ({ id: "c", code: "SALE", name: "Sale", discount_type: "flat", discount_value: 10, cap_amount: null, min_spend: 0, applies_to: "episodes", auto_apply: true, targets: [], ...over });

describe("cart pricing", () => {
  it("discounts only the tagged episode, not the whole cart", () => {
    const q = quoteCart([ep("e1"), ep("e2")], [coupon({ targets: [{ target_type: "episode", target_id: "e1" }] })], null);
    expect(q.lines.map((l) => l.final)).toEqual([20, 30]);
    expect(q.total).toBe(50);
  });
  it("shows one applied label when four tagged episodes use four offers", () => {
    const offers = ["e1", "e2", "e3", "e4"].map((id, i) => coupon({ id: `c${i}`, code: `CODE${i}`, targets: [{ target_type: "episode", target_id: id }] }));
    const q = quoteCart(["e1", "e2", "e3", "e4"].map((id) => ep(id)), offers, null);
    expect(q.discount).toBe(40);
    expect(q.appliedLabel).toBe("4 offers");
  });
  it("shows the code when one offer covers every discounted line", () => {
    const q = quoteCart([ep("e1"), ep("e2")], [coupon({ applies_to: "series", targets: [{ target_type: "series", target_id: "s1" }] })], null);
    expect(q.appliedLabel).toBe("SALE");
    expect(q.total).toBe(40);
  });
  it("never stacks a typed code on top of an auto offer for the same line", () => {
    const auto = coupon({ targets: [{ target_type: "episode", target_id: "e1" }] });
    const typed = coupon({ id: "m", code: "EXTRA", applies_to: "all", auto_apply: false, discount_type: "percent", discount_value: 50 });
    const q = quoteCart([ep("e1"), ep("e2")], [auto], typed);
    expect(q.lines.map((l) => l.discount)).toEqual([15, 15]);
  });
  it("enforces minimum spend on eligible items", () => {
    const typed = coupon({ code: "BIG", applies_to: "all", auto_apply: false, min_spend: 100 });
    const q = quoteCart([ep("e1")], [], typed);
    expect(q.discount).toBe(0);
    expect(q.manualError).toMatch(/at least ৳100/);
  });
  it("caps a percent coupon across the cart", () => {
    const typed = coupon({ code: "HALF", applies_to: "all", auto_apply: false, discount_type: "percent", discount_value: 50, cap_amount: 20 });
    expect(quoteCart([ep("e1"), ep("e2")], [], typed).discount).toBe(20);
  });
  it("drops episodes when their whole series is in the cart", () => {
    const items = normaliseCart([ep("e1"), { type: "series" as const, id: "s1", seriesId: null, title: "S", price: 100 }, ep("e1")]);
    expect(items.map((i) => i.id)).toEqual(["s1"]);
  });
});
