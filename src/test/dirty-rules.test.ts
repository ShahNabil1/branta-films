import { describe, expect, it } from "vitest";
import { isDirty } from "@/lib/dirty";

describe("isDirty", () => {
  it("is clean when a word is deleted and typed back", () => {
    expect(isDirty({ title: "When" }, { title: "When" })).toBe(false);
  });
  it("ignores trailing spaces and key order", () => {
    expect(isDirty({ a: "When ", b: 1 }, { b: 1, a: "When" })).toBe(false);
  });
  it("ignores editor-only HTML whitespace and empty paragraphs", () => {
    expect(isDirty({ html: "<p>Hi</p>\n<p></p>" }, { html: "<p>Hi</p>" })).toBe(false);
  });
  it("detects a real change", () => {
    expect(isDirty({ title: "Whe" }, { title: "When" })).toBe(true);
    expect(isDirty({ published: true }, { published: false })).toBe(true);
  });
});
