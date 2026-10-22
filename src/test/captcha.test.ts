import { describe, expect, it } from "vitest";
import { isCaptchaRequired } from "../lib/captcha";

describe("Supabase-controlled captcha", () => {
  it("does not require Turnstile when Supabase accepts tokenless requests", () => {
    expect(isCaptchaRequired(null)).toBe(false);
    expect(isCaptchaRequired({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe(false);
  });
  it("requires Turnstile when enabled Supabase rejects a missing token", () => {
    expect(isCaptchaRequired({ code: "captcha_failed", message: "captcha verification process failed" })).toBe(true);
  });
  it("recognizes the recovery server's captcha error", () => {
    expect(isCaptchaRequired(new Error("The security check failed. Please try it again."))).toBe(true);
  });
});