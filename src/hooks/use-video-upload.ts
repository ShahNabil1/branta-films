import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { startAdminMultipartVideo, signAdminVideoParts, completeAdminMultipartVideo } from "@/lib/admin.functions";
import { uploadActive, uploadMetrics, type UploadStatus } from "@/lib/upload-metrics";

export function useVideoUpload(episodeId: string, onSaved: (pending: boolean) => Promise<void>) {
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const fileRef = useRef<File | null>(null);
  const completedKey = useRef<string | null>(null);
  const running = useRef(false);
  const startUpload = useServerFn(startAdminMultipartVideo);
  const signParts = useServerFn(signAdminVideoParts);
  const complete = useServerFn(completeAdminMultipartVideo);
  /** Resumable session: finished parts survive a Retry, so only missing parts are re-sent. */
  const session = useRef<{ key: string; uploadId: string; partSize: number; done: Map<number, string> } | null>(null);
  const xhrs = useRef(new Set<XMLHttpRequest>());
  const active = uploadActive(status?.phase);
  useEffect(() => () => { xhrs.current.forEach(x => x.abort()); }, []);
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
      if (file.type !== "video/mp4" || file.size > 200 * 1024 ** 3 || !file.size) throw new Error("Choose an MP4 video under 200 GB.");
      fileRef.current = file; completedKey.current = null; session.current = null;
    }
    const selected = fileRef.current;
    if (!selected) return;
    running.current = true;
    let loaded = 0;
    const started = performance.now();
    const update = (phase: UploadStatus["phase"], error?: string) => {
      const elapsed = (performance.now() - started) / 1000;
      setStatus({ name: selected.name, total: selected.size, loaded, elapsed, speed: uploadMetrics(loaded, selected.size, elapsed).speed, phase, ...(error ? { error } : {}) });
    };
    update("preparing");
    const ticker = window.setInterval(() => update("uploading"), 1000);
    try {
      if (!session.current) {
        const partSize = Math.max(16 * 1024 ** 2, Math.ceil(selected.size / 9000));
        const created = await startUpload({ data: { episodeId } });
        session.current = { ...created, partSize, done: new Map() };
      }
      const s = session.current;
      const count = Math.ceil(selected.size / s.partSize);
      const sizeOf = (n: number) => Math.min(s.partSize, selected.size - (n - 1) * s.partSize);
      const inFlight = new Map<number, number>();
      const recompute = () => { let sum = 0; s.done.forEach((_, n) => { sum += sizeOf(n); }); inFlight.forEach(v => { sum += v; }); loaded = Math.min(sum, selected.size); };
      recompute(); update("uploading");
      const pending = Array.from({ length: count }, (_, i) => i + 1).filter(n => !s.done.has(n));
      const sendPart = (n: number, url: string) => new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest(); xhrs.current.add(xhr);
        xhr.open("PUT", url);
        xhr.upload.onprogress = e => { inFlight.set(n, e.loaded); recompute(); };
        const done = () => { xhrs.current.delete(xhr); inFlight.delete(n); };
        xhr.onload = () => { done(); const etag = xhr.getResponseHeader("ETag");
          if (xhr.status >= 200 && xhr.status < 300 && etag) resolve(etag);
          else if (xhr.status >= 200 && xhr.status < 300) reject(new Error("R2 hid the upload receipt (ETag). Add ETag to ExposeHeaders in the bucket CORS policy."));
          else reject(Object.assign(new Error(`Part rejected (${xhr.status}).`), { status: xhr.status })); };
        xhr.onerror = () => { done(); reject(new Error("Connection interrupted.")); };
        xhr.onabort = () => { done(); reject(Object.assign(new Error("Upload stopped."), { aborted: true })); };
        xhr.send(selected.slice((n - 1) * s.partSize, (n - 1) * s.partSize + sizeOf(n)));
      });
      const uploadWithRetry = async (n: number) => {
        for (let attempt = 0; ; attempt++) {
          try {
            const { urls } = await signParts({ data: { episodeId, key: s.key, uploadId: s.uploadId, parts: [n] } });
            const etag = await sendPart(n, urls[0]!.url);
            s.done.set(n, etag); recompute(); return;
          } catch (err) {
            if ((err as { aborted?: boolean }).aborted || attempt >= 6 || String((err as Error).message).includes("ETag")) throw err;
            if (!navigator.onLine) await new Promise<void>(r => window.addEventListener("online", () => r(), { once: true }));
            await new Promise(r => setTimeout(r, Math.min(30_000, 1000 * 2 ** attempt)));
          }
        }
      };
      let next = 0;
      const worker = async () => { while (next < pending.length) await uploadWithRetry(pending[next++]!); };
      await Promise.all(Array.from({ length: Math.min(4, pending.length) }, worker));
      loaded = selected.size; update("verifying");
      const result = await complete({ data: { episodeId, key: s.key, uploadId: s.uploadId, parts: [...s.done].map(([partNumber, etag]) => ({ partNumber, etag })) } });
      update("complete"); fileRef.current = null; completedKey.current = null; session.current = null;
      try { await onSaved(result.cleanupPending); } catch { /* The file is saved even if the preview refresh fails. */ }
    } catch (error) {
      xhrs.current.forEach(x => x.abort());
      update("failed", `${error instanceof Error ? error.message : "Upload failed."} Retry resumes from the parts already sent.`);
    }
    finally { window.clearInterval(ticker); running.current = false; }
  }
  return { status, active, start, retry: () => start() };
}