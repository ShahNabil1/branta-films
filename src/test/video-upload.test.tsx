import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ prepare: vi.fn(), finish: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/admin.functions", () => ({ prepareAdminVideo: mocks.prepare, finishAdminVideo: mocks.finish }));
import { useVideoUpload } from "@/hooks/use-video-upload";
class UploadXHR {
  static requests: UploadXHR[] = [];
  upload = { onprogress: (_e: { loaded: number }) => {} };
  status = 200;
  onload = () => {};
  onerror = () => {};
  onabort = () => {};
  open() {} setRequestHeader() {} send() { UploadXHR.requests.push(this); } abort() { this.onabort(); }
}
describe("Upload failure recovery", () => {
  beforeEach(() => { vi.clearAllMocks(); UploadXHR.requests = []; vi.stubGlobal("XMLHttpRequest", UploadXHR); mocks.prepare.mockResolvedValue({ key: "videos/new.mp4", url: "https://example.test/upload" }); mocks.finish.mockResolvedValue({ cleanupPending: false }); });
  it("preserves a failed file and retries its transfer", async () => {
    const { result } = renderHook(() => useVideoUpload("episode", async () => {}));
    let promise: Promise<void> | undefined;
    act(() => { promise = result.current.start(new File(["bytes"], "clip.mp4", { type: "video/mp4" })); });
    await waitFor(() => expect(UploadXHR.requests).toHaveLength(1));
    await act(async () => { UploadXHR.requests[0]?.onerror(); await promise; });
    expect(result.current.status?.phase).toBe("failed");
    act(() => { promise = result.current.retry(); });
    await waitFor(() => expect(UploadXHR.requests).toHaveLength(2));
    await act(async () => { UploadXHR.requests[1]?.onload(); await promise; });
    expect(result.current.status?.phase).toBe("complete");
    expect(mocks.prepare).toHaveBeenCalledTimes(2);
  });
  it("retries verification without re-uploading a completed transfer", async () => {
    mocks.finish.mockRejectedValueOnce(new Error("Temporary verification failure"));
    const { result } = renderHook(() => useVideoUpload("episode", async () => {}));
    let promise: Promise<void> | undefined;
    act(() => { promise = result.current.start(new File(["bytes"], "clip.mp4", { type: "video/mp4" })); });
    await waitFor(() => expect(UploadXHR.requests).toHaveLength(1));
    await act(async () => { UploadXHR.requests[0]?.onload(); await promise; });
    expect(result.current.status?.phase).toBe("failed");
    await act(async () => { await result.current.retry(); });
    expect(result.current.status?.phase).toBe("complete");
    expect(UploadXHR.requests).toHaveLength(1);
    expect(mocks.finish).toHaveBeenCalledTimes(2);
  });
});