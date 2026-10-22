import { describe, expect, it } from "vitest";
import { addGenre, initialReleaseYear } from "../lib/series-metadata";

describe("series metadata", () => {
  it("defaults new series to 2026 during 2026", () => {
    expect(initialReleaseYear(null, true, new Date("2026-10-22T01:47:00Z"))).toBe("2026");
  });
  it("automatically defaults to 2027 in 2027", () => {
    expect(initialReleaseYear(null, true, new Date("2027-01-01T00:00:00Z"))).toBe("2027");
  });
  it("preserves a manually selected year", () => {
    expect(initialReleaseYear(2020, false, new Date("2027-01-01T00:00:00Z"))).toBe("2020");
  });
  it("does not change a blank year on an existing series", () => {
    expect(initialReleaseYear(null, false)).toBe("");
  });
  it("adds genres one at a time in selection order", () => {
    expect(addGenre(addGenre([], "Drama"), "Thriller")).toEqual(["Drama", "Thriller"]);
  });
  it("does not add the same genre twice", () => {
    expect(addGenre(["Drama"], "drama")).toEqual(["Drama"]);
  });
});