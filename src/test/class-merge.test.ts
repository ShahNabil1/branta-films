import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn keeps Branta type-scale classes", () => {
  it("keeps text-eyebrow next to a text colour", () => {
    expect(cn("text-eyebrow text-muted-foreground")).toBe("text-eyebrow text-muted-foreground");
  });
  it("keeps text-h3 next to text-foreground", () => {
    expect(cn("text-h3 font-semibold", "text-foreground")).toBe("text-h3 font-semibold text-foreground");
  });
  it("still lets a later type size replace an earlier one", () => {
    expect(cn("text-small", "text-body")).toBe("text-body");
  });
});
