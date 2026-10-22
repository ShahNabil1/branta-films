import { describe, expect, it } from "vitest";
import { seriesPrice } from "@/lib/pricing";

describe("series price", () => {
  it("uses the discounted price when it is lower", () => expect(seriesPrice(300, 199)).toMatchObject({ final: 199, original: 300, percentOff: 34 }));
  it("ignores an empty discount", () => expect(seriesPrice(300, null)).toMatchObject({ final: 300, original: null }));
  it("ignores a discount that is not lower than the price", () => expect(seriesPrice(300, 300)).toMatchObject({ final: 300, original: null }));
});
