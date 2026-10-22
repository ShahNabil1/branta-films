import { describe, expect, it } from "vitest";
import { googleNonce, PASSKEY_SNOOZE_MS, shouldOfferPasskey } from "@/lib/quick-sign-in";

const eligible = { freshSignIn: true, supported: true, keyCount: 0, dismissedAt: 0, now: 1000 };
describe("post-login passkey consent", () => {
  it("offers setup after successful sign-in when no passkey exists", () => {
    expect(shouldOfferPasskey(eligible)).toBe(true);
  });
  it("does not offer an existing passkey holder another initial setup", () => {
    expect(shouldOfferPasskey({ ...eligible, keyCount: 1 })).toBe(false);
  });
  it("does not offer setup merely for a restored session", () => {
    expect(shouldOfferPasskey({ ...eligible, freshSignIn: false })).toBe(false);
  });
  it("respects a dismissal for 30 days", () => {
    expect(shouldOfferPasskey({ ...eligible, dismissedAt: 1000, now: 1000 + PASSKEY_SNOOZE_MS - 1 })).toBe(false);
    expect(shouldOfferPasskey({ ...eligible, dismissedAt: 1000, now: 1000 + PASSKEY_SNOOZE_MS })).toBe(true);
  });
  it("does not offer unsupported browsers setup", () => {
    expect(shouldOfferPasskey({ ...eligible, supported: false })).toBe(false);
  });
});
it("generates unique nonces and sends Google the SHA-256 hash rather than the original", async () => {
  const first = await googleNonce();
  const second = await googleNonce();
  expect(first.raw).not.toBe(second.raw);
  expect(first.hashed).not.toBe(first.raw);
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(first.raw));
  expect(first.hashed).toBe(Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, "0")).join(""));
});