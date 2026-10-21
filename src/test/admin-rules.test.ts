import { describe, expect, it } from "vitest";
import { assertOtherAccount, canAdminister, loginDestination } from "@/lib/admin-rules";

describe("Administrator controls", () => {
  it("opens the admin panel for an administrator after login", () => {
    expect(loginDestination(["admin"], "/")).toBe("/admin");
  });
  it("does not grant full CRUD to viewers or managers", () => {
    expect(canAdminister([])).toBe(false);
    expect(canAdminister(["manager"])).toBe(false);
    expect(canAdminister(["admin"])).toBe(true);
  });
  it("prevents administrators from removing their own access or account", () => {
    expect(() => assertOtherAccount("owner", "owner")).toThrow();
    expect(() => assertOtherAccount("owner", "viewer")).not.toThrow();
  });
});