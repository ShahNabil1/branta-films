import { describe, expect, it } from "vitest";
import { r2VideoKeyFromInput } from "@/lib/video-key";

describe("r2VideoKeyFromInput", () => {
  it("accepts a plain key", () => expect(r2VideoKeyFromInput("videos/series/a/e01.mp4")).toBe("videos/series/a/e01.mp4"));
  it("strips the bucket from an R2 URL", () => expect(r2VideoKeyFromInput("https://acc.r2.cloudflarestorage.com/branta-films/videos/x/e%2001.mp4")).toBe("videos/x/e 01.mp4"));
  it("rejects files outside videos/", () => expect(r2VideoKeyFromInput("images/series/a/poster.mp4")).toBeNull());
  it("rejects non-mp4", () => expect(r2VideoKeyFromInput("videos/a/e01.mov")).toBeNull());
  it("rejects traversal", () => expect(r2VideoKeyFromInput("videos/../images/a.mp4")).toBeNull());
});
