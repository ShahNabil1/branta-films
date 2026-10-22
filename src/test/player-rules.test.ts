import { describe, expect, it } from "vitest";
import { PLAYBACK_SPEEDS, QUALITY_HEIGHTS, seekTarget, networkQualityCap } from "../lib/player-rules";
describe("player rules", () => {
  it("seeks forward exactly ten seconds", () => expect(seekTarget(20, 100, 10)).toBe(30));
  it("seeks backward exactly ten seconds", () => expect(seekTarget(20, 100, -10)).toBe(10));
  it("does not seek outside the video", () => {
    expect(seekTarget(5, 100, -10)).toBe(0);
    expect(seekTarget(95, 100, 10)).toBe(100);
  });
  it("offers the requested speeds", () => expect([...PLAYBACK_SPEEDS]).toEqual([0.5, 1, 1.25, 1.5, 2]));
  it("offers the requested quality heights", () => expect([...QUALITY_HEIGHTS]).toEqual([360, 480, 720, 1080]));
  it("caps adaptive quality for constrained connections", () => {
    expect(networkQualityCap(1)).toBe(360);
    expect(networkQualityCap(2)).toBe(480);
    expect(networkQualityCap(4)).toBe(720);
    expect(networkQualityCap(10)).toBe(1080);
    expect(networkQualityCap(10, true)).toBe(480);
  });
});