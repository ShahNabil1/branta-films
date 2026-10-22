import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatDuration } from "@/lib/format";

const mocks = vi.hoisted(() => ({ compute: vi.fn(), dispose: vi.fn() }));
vi.mock("mediabunny", () => ({
  MP4: {},
  UrlSource: class {},
  Input: class { computeDuration = mocks.compute; dispose = mocks.dispose; },
}));
vi.mock("@/lib/r2.server", () => ({ presignR2Get: async () => "https://example.test/private-video" }));
import { readVideoDuration } from "@/lib/video-duration.server";

describe("Actual video duration", () => {
  beforeEach(() => vi.clearAllMocks());
  it("derives whole seconds from the file rather than a manually supplied time", async () => {
    mocks.compute.mockResolvedValue(16.96);
    expect(await readVideoDuration("videos/episode.mp4")).toBe(16);
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });
  it.each([0, -1, NaN, Infinity])("rejects invalid file duration %s", async duration => {
    mocks.compute.mockResolvedValue(duration);
    await expect(readVideoDuration("videos/episode.mp4")).rejects.toThrow("valid duration");
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });
  it("public duration retains actual seconds, including sub-minute clips", () => {
    expect(formatDuration(16)).toBe("0:16");
    expect(formatDuration(135)).toBe("2:15");
    expect(formatDuration(3675)).toBe("1:01:15");
  });
});