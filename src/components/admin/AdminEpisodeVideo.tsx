import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { getAdminEpisodeMedia } from "@/lib/admin.functions";
import { mediaUrl } from "@/lib/media";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { Button } from "@/components/ui/button";

export function AdminEpisodeVideo({ episodeId, title, thumbnail }: { episodeId: string; title: string; thumbnail: string | null }) {
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
  if (isPending) return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading saved video…</p>;
  if (error) return <div className="flex flex-wrap items-center gap-3"><p role="alert" className="text-sm text-destructive">Could not load saved video.</p><Button type="button" variant="outline" onClick={() => void refetch()}><RefreshCw />Retry</Button></div>;
  if (!data || data.status === "empty") return <p className="text-sm text-muted-foreground">No video uploaded yet.</p>;
  if (data.status === "missing") return <p role="alert" className="text-sm text-destructive">The saved video file is missing from storage. Replace the video to restore playback.</p>;
  return <div className="space-y-3">
    <div className="light-reset overflow-hidden rounded-lg"><VideoPlayer key={data.source?.url} getSource={getSource} poster={mediaUrl(thumbnail)} title={title} onProgress={() => {}} /></div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="flex items-center gap-1.5 font-semibold text-success"><Check className="size-4" />Saved video · MP4</span>{data.sizeBytes != null ? <span className="tabular-nums text-muted-foreground">{(data.sizeBytes / 1024 / 1024).toFixed(1)} MB</span> : null}</div>
  </div>;
}