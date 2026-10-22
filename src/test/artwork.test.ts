import { describe, expect, it } from "vitest";
import { ARTWORK_SPECS, moveItem } from "@/lib/artwork";

describe("artwork sizes", () => {
  it("poster exports 1000x1500 (2:3)", () => expect([ARTWORK_SPECS.poster.width, ARTWORK_SPECS.poster.height]).toEqual([1000, 1500]));
  it("backdrop exports 1920x1080 (16:9)", () => expect([ARTWORK_SPECS.backdrop.width, ARTWORK_SPECS.backdrop.height]).toEqual([1920, 1080]));
});

describe("drag reorder", () => {
  it("dragging the last item to the top puts it first", () => expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]));
  it("dragging the first item down puts it below", () => expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]));
});
