import { describe, expect, it } from "vitest";
import { profilePicture } from "../lib/profile-picture";

describe("profile picture selection", () => {
  const googleUser = { user_metadata: { picture: "https://lh3.googleusercontent.com/avatar" } };
  it("uses an uploaded replacement before the Google picture", () => {
    expect(profilePicture({ avatar_url: "images/avatars/member.webp" }, googleUser)).toBe("/api/public/media/images/avatars/member.webp");
  });
  it("automatically uses the Google picture without an uploaded avatar", () => {
    expect(profilePicture({ avatar_url: null }, googleUser)).toBe("https://lh3.googleusercontent.com/avatar");
  });
  it("finds the linked Google identity picture", () => {
    expect(profilePicture(null, { identities: [{ provider: "google", identity_data: { picture: "https://lh3.googleusercontent.com/linked" } }] })).toBe("https://lh3.googleusercontent.com/linked");
  });
  it("rejects invalid provider pictures and leaves the initials fallback", () => {
    expect(profilePicture(null, { user_metadata: { picture: "javascript:bad", avatar_url: 42 } })).toBeNull();
  });
});