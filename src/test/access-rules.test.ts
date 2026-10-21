import { describe, expect, it } from "vitest";
import { decidePlayback, isCompleted, PLAYBACK_LINK_TTL_SECONDS, PROGRESS_SAVE_INTERVAL_MS } from "@/lib/access";

const base = { signedIn: true, isStaff: false, published: true, isFree: false, unlocked: false };

describe("Playback access", () => {
  it("free episodes play for any signed-in user", () => {
    expect(decidePlayback({ ...base, isFree: true })).toBe("allowed");
  });
  it("free episodes still require sign-in", () => {
    expect(decidePlayback({ ...base, isFree: true, signedIn: false })).toBe("sign_in_required");
  });
  it("paid episodes are locked until the series is unlocked", () => {
    expect(decidePlayback(base)).toBe("locked");
  });
  it("paid episodes play once the series is unlocked", () => {
    expect(decidePlayback({ ...base, unlocked: true })).toBe("allowed");
  });
  it("unpublished episodes are unavailable to viewers even if unlocked", () => {
    expect(decidePlayback({ ...base, unlocked: true, published: false })).toBe("unavailable");
  });
  it("staff can preview anything", () => {
    expect(decidePlayback({ ...base, isStaff: true, published: false })).toBe("allowed");
  });
});

describe("Playback timing", () => {
  it("progress saves every 10 seconds", () => {
    expect(PROGRESS_SAVE_INTERVAL_MS).toBe(10_000);
  });
  it("signed video links are time-limited to 15 minutes", () => {
    expect(PLAYBACK_LINK_TTL_SECONDS).toBe(900);
  });
  it("an episode counts as finished at 95%", () => {
    expect(isCompleted(95, 100)).toBe(true);
    expect(isCompleted(94, 100)).toBe(false);
  });
});
