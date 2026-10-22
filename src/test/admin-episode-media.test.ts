import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exists: vi.fn(), sign: vi.fn(), episode: vi.fn(), media: vi.fn(), rpc: vi.fn(), duration: vi.fn(), update: vi.fn(), write: vi.fn(),
}));
vi.mock("@/lib/security-middleware", () => ({ requireAccountAccess: {} }));
vi.mock("@tanstack/react-start", () => ({
  createMiddleware: () => {
    const builder = { middleware: () => builder, server: (handler: unknown) => handler };
    return builder;
  },
  createServerFn: () => {
    let middlewares: Array<(args: unknown) => Promise<unknown>> = [];
    const builder = {
      middleware: (items: typeof middlewares) => { middlewares = items; return builder; },
      inputValidator: () => builder,
      handler: (handler: (args: unknown) => Promise<unknown>) => async (args: unknown) => {
        for (const middleware of middlewares) await middleware({ ...(args as object), next: async () => ({}) });
        return handler(args);
      },
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.media }) }), update: (values: unknown) => { mocks.update(values); return { eq: mocks.write }; } }) },
}));
vi.mock("@/lib/r2.server", () => ({ r2ObjectExists: mocks.exists, presignR2Get: mocks.sign }));
vi.mock("@/lib/video-cleanup.server", () => ({ flushVideoCleanup: async () => false }));
vi.mock("@/lib/video-duration.server", () => ({ readVideoDuration: mocks.duration }));

import { getAdminEpisodeMedia } from "@/lib/admin.functions";

const episodeId = "22222222-2222-4222-8222-000000000101";
const request = {
  data: { episodeId },
  context: { userId: "admin", supabase: {
    rpc: mocks.rpc,
    from: () => ({ select: () => ({ eq: () => ({ single: mocks.episode }) }) }),
  } },
};
// The mock runs the real function handler and its admin middleware with server context.
const readMedia = getAdminEpisodeMedia as unknown as (input: typeof request) => ReturnType<typeof getAdminEpisodeMedia>;

describe("Saved episode admin media", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    mocks.episode.mockResolvedValue({ data: { id: episodeId, thumbnail_url: "images/episodes/saved.webp" }, error: null });
    mocks.media.mockResolvedValue({ data: { video_key: "videos/private.mp4", content_type: "video/mp4", size_bytes: 5481584 }, error: null });
    mocks.exists.mockResolvedValue(true);
    mocks.sign.mockResolvedValue("https://example.test/temporary-signed-video");
    mocks.duration.mockResolvedValue(16);
    mocks.write.mockResolvedValue({ error: null });
  });
  it("returns saved thumbnail and video metadata on reopening, without the permanent key", async () => {
    const result = await readMedia(request);
    expect(result.thumbnail).toBe("images/episodes/saved.webp");
    expect(result.sizeBytes).toBe(5481584);
    expect(result.status).toBe("ready");
    expect(JSON.stringify(result)).not.toContain("videos/private.mp4");
    expect(mocks.sign).toHaveBeenCalledWith("videos/private.mp4", 900);
  });
  it("does not hide an existing video when no thumbnail was saved", async () => {
    mocks.episode.mockResolvedValue({ data: { id: episodeId, thumbnail_url: null }, error: null });
    const result = await readMedia(request);
    expect(result.thumbnail).toBeNull();
    expect(result.status).toBe("ready");
    expect(result.source).toEqual(expect.objectContaining({ url: "https://example.test/temporary-signed-video" }));
  });
  it("distinguishes a never-uploaded video from a missing stored object", async () => {
    mocks.media.mockResolvedValueOnce({ data: null, error: null });
    expect((await readMedia(request)).status).toBe("empty");
    mocks.exists.mockResolvedValue(false);
    expect((await readMedia(request)).status).toBe("missing");
    expect(mocks.sign).not.toHaveBeenCalled();
  });
  it("denies non-admin callers before reading private video metadata", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    await expect(readMedia(request)).rejects.toThrow("Administrator access required.");
    expect(mocks.media).not.toHaveBeenCalled();
    expect(mocks.sign).not.toHaveBeenCalled();
  });
  it("automatically repairs an existing video's duration from its real file", async () => {
    const result = await readMedia(request);
    expect(mocks.duration).toHaveBeenCalledWith("videos/private.mp4");
    expect(result).toMatchObject({ durationSeconds: 16 });
    expect(mocks.update).toHaveBeenCalledWith({ duration_seconds: 16 });
    expect(mocks.write).toHaveBeenCalledWith("id", episodeId);
  });
  it("does not rewrite an already accurate duration", async () => {
    mocks.episode.mockResolvedValue({ data: { id: episodeId, thumbnail_url: null, duration_seconds: 16 }, error: null });
    expect(await readMedia(request)).toMatchObject({ durationSeconds: 16 });
    expect(mocks.update).not.toHaveBeenCalled();
  });
});