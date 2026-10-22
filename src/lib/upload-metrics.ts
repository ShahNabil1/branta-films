export type UploadPhase = "preparing" | "uploading" | "verifying" | "complete" | "failed";
export type UploadStatus = { name: string; total: number; loaded: number; speed: number; elapsed: number; phase: UploadPhase; error?: string };
export function uploadMetrics(loaded: number, total: number, elapsedSeconds: number) {
  const bytes = Math.max(0, Math.min(loaded, total));
  const speed = elapsedSeconds > 0 ? bytes / elapsedSeconds : 0;
  return { percent: total > 0 ? Math.min(100, Math.floor(bytes / total * 100)) : 0, speed, remaining: speed > 0 ? Math.ceil((total - bytes) / speed) : null };
}
export function fileSize(bytes: number) {
  return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(2)} GB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
export function uploadActive(phase?: UploadPhase) { return phase === "preparing" || phase === "uploading" || phase === "verifying"; }