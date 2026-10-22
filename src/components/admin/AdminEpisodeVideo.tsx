import { useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, RefreshCw, Upload, Trash2 } from "lucide-react";
import { deleteAdminVideo, getAdminEpisodeMedia } from "@/lib/admin.functions";
import { ConfirmDialog } from "@/components/ui/branded-dialog";
import { toast } from "sonner";
import { mediaUrl } from "@/lib/media";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { Button } from "@/components/ui/button";

export function AdminEpisodeVideo({ episodeId, title, thumbnail, editing, busy, onUpload }: { episodeId: string; title: string; thumbnail: string | null; editing: boolean; busy: boolean; onUpload: (file: File | undefined) => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const qc = useQueryClient();
  const removeVideo = useServerFn(deleteAdminVideo);
  const readMedia = useServerFn(getAdminEpisodeMedia);
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin-episode-media", episodeId],
    queryFn: () => readMedia({ data: { episodeId } }),
    staleTime: 0,
    retry: false,
  });
  const getSource = useCallback(async () => {
    if (data?.source && data.source.expiresAt > Date.now() + 60_000) return data.source;
    return (await readMedia({ data: { episodeId } })).source;
  }, [data, readMedia, episodeId]);
  async function remove() {
    setDeleting(true);
    try {
      const result = await removeVideo({ data: { episodeId } });
      await qc.invalidateQueries({ queryKey: ["admin-episode-media", episodeId] });
      setConfirmDelete(false);
      if (result.cleanupPending) toast.warning("Video removed. Storage cleanup will retry on your next episode visit.");
      else toast.success("Video deleted from the episode and R2.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not delete video."); }
    finally { setDeleting(false); }
  }
  if (isPending) return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading saved video…</p>;
  if (error) return <div className="flex flex-wrap items-center gap-3"><p role="alert" className="text-sm text-destructive">Could not load saved video.</p><Button type="button" variant="outline" onClick={() => void refetch()}><RefreshCw />Retry</Button></div>;
  const hasVideo = data?.status === "ready" || data?.status === "missing";
  return <div className="space-y-3">
    {data?.status === "ready" ? <><div className="overflow-hidden rounded-lg"><VideoPlayer key={data.source?.url} getSource={getSource} poster={mediaUrl(thumbnail)} title={title} onProgress={() => {}} /></div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="flex items-center gap-1.5 font-semibold text-success"><Check className="size-4" />Saved video · MP4</span>{data.sizeBytes != null ? <span className="tabular-nums text-muted-foreground">{(data.sizeBytes / 1024 / 1024).toFixed(1)} MB</span> : null}</div></> : <p className="text-sm text-muted-foreground">{data?.status === "missing" ? "Saved video file is missing. Replace it to restore playback." : "No video uploaded yet."}</p>}
    {data?.cleanupPending ? <div className="flex flex-wrap items-center gap-2"><p role="status" className="text-xs text-warning">Old video cleanup is pending.</p><Button type="button" variant="outline" size="sm" onClick={() => void refetch()}><RefreshCw />Retry cleanup</Button></div> : null}
    {editing ? <div className="flex flex-wrap gap-2">
      <input ref={input} type="file" className="sr-only" aria-label="Upload episode video" accept="video/mp4" disabled={busy || deleting} onChange={(e) => { void onUpload(e.target.files?.[0]); e.target.value = ""; }} />
      <Button type="button" disabled={busy || deleting} onClick={() => input.current?.click()}><Upload />{hasVideo ? "Replace video" : "Upload video"}</Button>
      {hasVideo ? <Button type="button" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" disabled={busy || deleting} onClick={() => setConfirmDelete(true)}><Trash2 />Delete video</Button> : null}
    </div> : null}
    <ConfirmDialog open={confirmDelete} onClose={() => { if (!deleting) setConfirmDelete(false); }} title="Delete episode video?" description="The video will be permanently removed from this episode and private R2 storage. Episode details and thumbnail will stay." confirmLabel="Delete video" destructive busy={deleting} onConfirm={() => void remove()} />
  </div>;
}