import { AlertTriangle, CheckCircle2, FileVideo, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileSize, uploadActive, uploadMetrics, type UploadStatus } from "@/lib/upload-metrics";
import { formatClock } from "@/lib/format";

export function VideoUploadStatus({ status, onRetry }: { status: UploadStatus | null; onRetry: () => void }) {
  if (!status) return null;
  const active = uploadActive(status.phase);
  const metrics = uploadMetrics(status.loaded, status.total, status.elapsed);
  const labels = { preparing: "Preparing secure upload", uploading: "Uploading video", verifying: "Upload received · verifying video", complete: "Video saved securely", failed: "Upload needs attention" };
  return <div role="region" aria-label="Video upload status" className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <div className="flex min-w-0 items-center gap-3"><FileVideo className="size-6 shrink-0 text-primary"/><div className="min-w-0"><p className="truncate text-sm font-semibold" title={status.name}>{status.name}</p><p className="text-xs text-muted-foreground">MP4 · {fileSize(status.total)}</p></div></div>
      {active ? <Loader2 className="size-5 animate-spin text-primary"/> : status.phase === "complete" ? <CheckCircle2 className="size-5 text-success"/> : <AlertTriangle className="size-5 text-destructive"/>}
    </div>
    <div className="space-y-2"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-sm"><span role="status" className="font-medium">{labels[status.phase]}</span><span className="tabular-nums font-semibold text-primary">{metrics.percent}%</span></div><progress aria-label="Video upload progress" max={100} value={metrics.percent} className="admin-progress block h-2 w-full"/></div>
    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><p className="text-muted-foreground">Transferred <span className="block font-medium tabular-nums text-foreground">{fileSize(status.loaded)} / {fileSize(status.total)}</span></p><p className="text-muted-foreground">Elapsed <span className="block font-medium tabular-nums text-foreground">{formatClock(status.elapsed)}</span></p>{status.phase === "uploading" ? <><p className="text-muted-foreground">Average speed <span className="block font-medium tabular-nums text-foreground">{status.speed > 0 ? `${fileSize(status.speed)}/s` : "Measuring…"}</span></p><p className="text-muted-foreground">Estimated remaining <span className="block font-medium tabular-nums text-foreground">{metrics.remaining == null ? "Calculating…" : `~${formatClock(metrics.remaining)}`}</span></p></> : null}</div>
    {active ? <p className="flex items-start gap-2 text-xs text-warning"><AlertTriangle className="size-4 shrink-0"/>Keep this tab open and visible. Closing, minimising or locking your device can interrupt the upload. Connection speed may change the estimate.</p> : null}
    {status.phase === "failed" ? <div className="space-y-3"><p role="alert" className="text-xs text-destructive">{status.error}</p><Button type="button" variant="outline" onClick={onRetry}><RefreshCw/>Retry upload</Button><p className="text-xs text-muted-foreground">Interrupted transfers restart from the beginning; completed transfers retry verification only.</p></div> : null}
  </div>;
}