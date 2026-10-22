import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ start: vi.fn(), sign: vi.fn(), complete: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/admin.functions", () => ({ startAdminMultipartVideo: mocks.start, signAdminVideoParts: mocks.sign, completeAdminMultipartVideo: mocks.complete }));
import { useVideoUpload } from "@/hooks/use-video-upload";
class UploadXHR {
  static requests: UploadXHR[] = [];
  upload = { onprogress: (_e: { loaded: number }) => {} };
  status = 200;
  onload = () => {}; onerror = () => {}; onabort = () => {};
  getResponseHeader(name: string) { return name === "ETag" ? '"etag-1"' : null; }
  open() {} send() { UploadXHR.requests.push(this); } abort() { this.onabort(); }
}
describe("Multipart upload recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks(); UploadXHR.requests = []; vi.stubGlobal("XMLHttpRequest", UploadXHR);
    mocks.start.mockResolvedValue({ key: "videos/episodes/e/x.mp4", uploadId: "up-1" });
    mocks.sign.mockImplementation(async ({ data }: { data: { parts: number[] } }) => ({ urls: data.parts.map(n => ({ partNumber: n, url: `https://r2.test/${n}` })) }));
    mocks.complete.mockResolvedValue({ cleanupPending: false });
  });
  it("sends parts with their receipts and finishes", async () => {
    const { result } = renderHook(() => useVideoUpload("episode", async () => {}));
    let promise: Promise<void> | undefined;
    act(() => { promise = result.current.start(new File(["bytes"], "clip.mp4", { type: "video/mp4" })); });
    await waitFor(() => expect(UploadXHR.requests).toHaveLength(1));
    await act(async () => { UploadXHR.requests[0]?.onload(); await promise; });
    expect(result.current.status?.phase).toBe("complete");
    expect(mocks.complete.mock.calls[0]?.[0].data.parts).toEqual([{ partNumber: 1, etag: '"etag-1"' }]);
  });
  it("retry after a failed finish does not resend finished parts", async () => {
    mocks.complete.mockRejectedValueOnce(new Error("Temporary failure"));
    const { result } = renderHook(() => useVideoUpload("episode", async () => {}));
    let promise: Promise<void> | undefined;
    act(() => { promise = result.current.start(new File(["bytes"], "clip.mp4", { type: "video/mp4" })); });
    await waitFor(() => expect(UploadXHR.requests).toHaveLength(1));
    await act(async () => { UploadXHR.requests[0]?.onload(); await promise; });
    expect(result.current.status?.phase).toBe("failed");
    await act(async () => { await result.current.retry(); });
    expect(result.current.status?.phase).toBe("complete");
    expect(UploadXHR.requests).toHaveLength(1);
    expect(mocks.start).toHaveBeenCalledTimes(1);
  });
});
