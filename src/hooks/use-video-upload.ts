import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { prepareAdminVideo, finishAdminVideo } from "@/lib/admin.functions";
import { uploadActive, uploadMetrics, type UploadStatus } from "@/lib/upload-metrics";

export function useVideoUpload(episodeId: string, onSaved: (pending: boolean) => Promise<void>) {
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const fileRef = useRef<File | null>(null);
  const completedKey = useRef<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const running = useRef(false);
  const prepare = useServerFn(prepareAdminVideo);
  const finish = useServerFn(finishAdminVideo);
  const active = uploadActive(status?.phase);
  useEffect(() => () => { xhrRef.current?.abort(); }, []);
  useEffect(() => {
    if (!active) return;
    let lock: WakeLockSentinel | null = null;
    let disposed = false;
    const request = async () => {
      if (document.visibilityState !== "visible" || !navigator.wakeLock) return;
      try { const acquired = await navigator.wakeLock.request("screen"); if (disposed) await acquired.release(); else lock = acquired; } catch { /* Device decides whether it can stay awake. */ }
    };
    void request();
    document.addEventListener("visibilitychange", request);
    return () => { disposed = true; document.removeEventListener("visibilitychange", request); void lock?.release(); };
  }, [active]);
  async function start(file?: File) {
    if (running.current) return;
    if (file) {
      if (file.type !== "video/mp4" || file.size > 5 * 1024 ** 3 || !file.size) throw new Error("Choose an MP4 video under 5 GB.");
      fileRef.current = file; completedKey.current = null;
    }
    const selected = fileRef.current;
    if (!selected) return;
    running.current = true;
    let loaded = completedKey.current ? selected.size : 0;
    const started = performance.now();
    const update = (phase: UploadStatus["phase"], error?: string) => {
      const elapsed = (performance.now() - started) / 1000;
      setStatus({ name: selected.name, total: selected.size, loaded, elapsed, speed: uploadMetrics(loaded, selected.size, elapsed).speed, phase, error });
    };
    update(completedKey.current ? "verifying" : "preparing");
    try {
      if (!completedKey.current) {
        const upload = await prepare({ data: { episodeId } });
        update("uploading");
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest(); xhrRef.current = xhr;
          xhr.open("PUT", upload.url); xhr.setRequestHeader("Content-Type", "video/mp4");
          const ticker = window.setInterval(() => update("uploading"), 1000);
          const end = (error?: Error) => { window.clearInterval(ticker); xhrRef.current = null; if (error) reject(error); else resolve(); };
          xhr.upload.onprogress = event => { loaded = Math.min(event.loaded, selected.size); update("uploading"); };
          xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? end() : end(new Error(`Upload rejected (${xhr.status}). Retry after checking your connection and upload permissions.`));
          xhr.onerror = () => end(new Error("Connection interrupted. Keep this page open and retry when your connection returns."));
          xhr.onabort = () => end(new Error("Upload interrupted. Retry to send the file again."));
          xhr.send(selected);
        });
        completedKey.current = upload.key;
      }
      loaded = selected.size; update("verifying");
      const result = await finish({ data: { episodeId, key: completedKey.current, size: selected.size } });
      update("complete"); fileRef.current = null; completedKey.current = null;
      await onSaved(result.cleanupPending);
    } catch (error) { update("failed", error instanceof Error ? error.message : "Upload failed. Please retry."); }
    finally { running.current = false; }
  }
  return { status, active, start, retry: () => start() };
}