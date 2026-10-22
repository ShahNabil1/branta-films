import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ duration: vi.fn(), update: vi.fn(), upsert: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/security-middleware", () => ({ requireAccountAccess: {} }));
vi.mock("@tanstack/react-start", () => ({
  createMiddleware: () => { const b = { middleware: () => b, server: () => b }; return b; },
  createServerFn: () => {
    let validate = (input: unknown) => input;
    const b = { middleware: () => b, inputValidator: (v: typeof validate) => { validate = v; return b; }, handler: (h: (args: unknown) => unknown) => (args: { data: unknown; context: unknown }) => h({ ...args, data: validate(args.data) }) };
    return b;
  },
}));
const client = { from: () => ({
  update: (v: unknown) => { mocks.update(v); return { eq: () => ({ error: null, select: () => ({ single: async () => ({ data: { id: "saved" }, error: null }) }) }) }; },
  upsert: mocks.upsert,
  delete: () => ({ eq: mocks.remove }),
}) };
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: client }));
vi.mock("@/lib/r2.server", () => ({ r2ObjectExists: async () => true }));
vi.mock("@/lib/video-duration.server", () => ({ readVideoDuration: mocks.duration }));
vi.mock("@/lib/video-cleanup.server", () => ({ flushVideoCleanup: async () => false }));
import { finishAdminVideo, deleteAdminVideo, saveAdminEpisode } from "@/lib/admin.functions";
const episodeId = "22222222-2222-4222-8222-000000000101";
const call = (fn: unknown, data: unknown) => (fn as (args: unknown) => Promise<unknown>)({ data, context: { supabase: client } });
describe("Persisted video duration rules", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.duration.mockResolvedValue(16); mocks.upsert.mockResolvedValue({ error: null }); mocks.remove.mockResolvedValue({ error: null }); });
  it("sets duration automatically after uploaded video finalization", async () => {
    await call(finishAdminVideo, { episodeId, key: `videos/episodes/${episodeId}/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.mp4`, size: 5481584 });
    expect(mocks.update).toHaveBeenCalledWith({ duration_seconds: 16 });
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ episode_id: episodeId }));
  });
  it("clears the duration when deleting the video", async () => {
    await call(deleteAdminVideo, { episodeId });
    expect(mocks.remove).toHaveBeenCalledWith("episode_id", episodeId);
    expect(mocks.update).toHaveBeenCalledWith({ duration_seconds: 0 });
  });
  it("metadata editing cannot overwrite the actual duration", async () => {
    await call(saveAdminEpisode, { id: episodeId, series_id: "11111111-1111-4111-8111-000000000001", title: "The Tip", episode_number: 1, synopsis_html: "", is_free: true, is_published: true, thumbnail_url: null, duration_seconds: 999 });
    const values = mocks.update.mock.calls[0]?.[0];
    expect(values).toMatchObject({ title: "The Tip" });
    expect(values).not.toHaveProperty("duration_seconds");
  });
});