import { describe, expect, it } from "vitest";
import { detectTypingLanguage, safeRedirect, validateNewPassword } from "@/lib/validation";
import { isAllowedMediaPath } from "@/lib/media";
import { isShieldDisabledHost, DEFAULT_DEVTOOLS_SHIELD_CONFIG } from "@/components/security/DevToolsShield";

describe("Password rules", () => {
  it("new password cannot equal the current password", () => {
    expect(validateNewPassword("Secret123", "Secret123")).toMatch(/different/);
  });
  it("accepts a different valid password", () => {
    expect(validateNewPassword("NewSecret9", "Secret123")).toBeUndefined();
  });
  it("requires at least 8 characters with a letter and a number", () => {
    expect(validateNewPassword("abc12")).toBeDefined();
    expect(validateNewPassword("abcdefgh")).toBeDefined();
    expect(validateNewPassword("abcdefg1")).toBeUndefined();
  });
});

describe("Typing language indicator", () => {
  it("detects Bangla and English", () => {
    expect(detectTypingLanguage("hello আমি")).toBe("bn");
    expect(detectTypingLanguage("আমি hello")).toBe("en");
    expect(detectTypingLanguage("123")).toBeNull();
  });
});

describe("Redirect safety", () => {
  it("only allows same-site paths", () => {
    expect(safeRedirect("/watch/abc")).toBe("/watch/abc");
    expect(safeRedirect("//evil.com")).toBe("/");
    expect(safeRedirect("https://evil.com")).toBe("/");
  });
});

describe("Media route", () => {
  it("serves only images, never videos", () => {
    expect(isAllowedMediaPath("images/series/neon-rain/poster.webp")).toBe(true);
    expect(isAllowedMediaPath("images/avatars/u/1.png")).toBe(true);
    expect(isAllowedMediaPath("videos/series/neon-rain/e01.mp4")).toBe(false);
    expect(isAllowedMediaPath("images/series/neon-rain/e01.mp4")).toBe(false);
    expect(isAllowedMediaPath("images/series/../../videos/x.webp")).toBe(false);
  });
});

describe("Security shield", () => {
  const s = DEFAULT_DEVTOOLS_SHIELD_CONFIG.disabledHostSuffixes;
  it("is off on localhost and preview domains", () => {
    expect(isShieldDisabledHost("localhost", s)).toBe(true);
    expect(isShieldDisabledHost("id-preview--x.lovable.app", s)).toBe(true);
  });
  it("is on for the production domain", () => {
    expect(isShieldDisabledHost("films.brantatech.com", s)).toBe(false);
  });
});
