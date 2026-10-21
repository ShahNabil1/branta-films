import { describe, expect, it } from "vitest";
import { amrFromAccessToken, isFreshInviteSession } from "@/lib/invite";

const now = 1_800_000_000;
const token = (amr: unknown) => `x.${btoa(JSON.stringify({ amr })).replace(/=+$/, "")}.y`;

describe("Staff invite sessions", () => {
  it("lets an invite opened within 24 hours set a password", () => {
    expect(isFreshInviteSession([{ method: "invite", timestamp: now - 60 }], now)).toBe(true);
  });
  it("rejects invites older than 24 hours", () => {
    expect(isFreshInviteSession([{ method: "invite", timestamp: now - 24 * 3600 - 1 }], now)).toBe(
      false,
    );
  });
  it("does not treat a password or code sign-in as an invite", () => {
    expect(isFreshInviteSession([{ method: "password", timestamp: now }], now)).toBe(false);
    expect(isFreshInviteSession([{ method: "otp", timestamp: now }], now)).toBe(false);
  });
  it("reads the sign-in method from the session token", () => {
    expect(amrFromAccessToken(token([{ method: "invite", timestamp: now }]))[0]?.method).toBe(
      "invite",
    );
    expect(amrFromAccessToken("garbage")).toEqual([]);
  });
});
