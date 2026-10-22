import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ queued: vi.fn(), active: vi.fn(), remove: vi.fn(), retry: vi.fn(), r2Delete: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: (table: string) => table === "video_cleanup_queue" ? {
  select: () => ({ order: () => ({ limit: mocks.queued }) }),
  delete: () => ({ eq: mocks.remove }),
  update: (values: unknown) => ({ eq: (...args: unknown[]) => mocks.retry(values, ...args) }),
} : { select: () => ({ eq: () => ({ limit: mocks.active }) }) } } }));
vi.mock("@/lib/r2.server", () => ({ r2DeleteObject: mocks.r2Delete }));
import { flushVideoCleanup } from "@/lib/video-cleanup.server";

describe("Automatic R2 video cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.queued.mockResolvedValue({ data: [{ video_key: "videos/old.mp4", attempts: 0 }], error: null });
    mocks.active.mockResolvedValue({ data: [], error: null });
    mocks.r2Delete.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue({ error: null });
    mocks.retry.mockResolvedValue({ error: null });
  });
  it("deletes old R2 files before clearing their durable cleanup record", async () => {
    expect(await flushVideoCleanup()).toBe(false);
    expect(mocks.r2Delete).toHaveBeenCalledWith("videos/old.mp4");
    expect(mocks.remove).toHaveBeenCalledWith("video_key", "videos/old.mp4");
    expect(mocks.r2Delete.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0] ?? 0);
  });
  it("keeps failed storage deletions queued for retry", async () => {
    mocks.r2Delete.mockRejectedValue(new Error("storage unavailable"));
    expect(await flushVideoCleanup()).toBe(true);
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.retry).toHaveBeenCalledWith({ attempts: 1 }, "video_key", "videos/old.mp4");
  });
  it("never deletes a video still attached to an episode", async () => {
    mocks.active.mockResolvedValue({ data: [{ episode_id: "other" }], error: null });
    expect(await flushVideoCleanup()).toBe(true);
    expect(mocks.r2Delete).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});