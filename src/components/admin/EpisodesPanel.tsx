import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Clapperboard, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Panel, Chip, editActionClass, deleteActionClass }
import { SortableList } from "./SortableList"; from "./AdminKit";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/branded-dialog";
import { adminQuery } from "@/lib/admin-queries";
import { deleteAdminContent, reorderAdminEpisodes } from "@/lib/admin.functions";
import { mediaUrl } from "@/lib/media";

const minutes = (s: number) => (s ? `${Math.round(s / 60)} min` : "No duration");

/** Episodes of one series: create, reorder, edit and delete — lives inside the series page. */
export function EpisodesPanel({ seriesId }: { seriesId: string }) {
  const { data } = useSuspenseQuery(adminQuery);
  const qc = useQueryClient();
  const series = data.series.find((s) => s.id === seriesId);
  const episodes = data.episodes.filter((e) => e.series_id === seriesId).sort((a, b) => a.episode_number - b.episode_number);
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState<{ id: string; title: string } | null>(null);

  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true);
    try { await action(); await qc.invalidateQueries({ queryKey: adminQuery.queryKey }); await qc.invalidateQueries({ queryKey: ["catalog"] }); toast.success(done); setRemove(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save changes"); }
    finally { setBusy(false); }
  }
  async function reorder(ids: string[]) {
    try { await reorderAdminEpisodes({ data: { series_id: seriesId, ids } }); await qc.invalidateQueries({ queryKey: adminQuery.queryKey }); await qc.invalidateQueries({ queryKey: ["catalog"] }); toast.success("Episode order saved"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save order"); throw e; }
  }

  return <Panel title="Episodes" description={`${episodes.length} episode${episodes.length === 1 ? "" : "s"} · drag ⠿ to change their order`}
    action={<Button asChild size="sm"><Link to="/admin/series/$id/episodes/$episodeId" params={{ id: seriesId, episodeId: "new" }}><Plus />New episode</Link></Button>}>
    {episodes.length ? <SortableList items={episodes} disabled={busy} onReorder={reorder} render={(e, i, handle) => {
      const art = mediaUrl(e.thumbnail_url ?? series?.backdrop_url ?? null);
      return <div className="group flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/60 p-2.5 transition-all duration-300 hover:border-primary/30 hover:bg-card hover:shadow-md sm:flex-nowrap">
        {handle}
        <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
          {art ? <img src={art} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <span className="grid size-full place-items-center text-muted-foreground"><Clapperboard className="size-5" /></span>}
          <span className="absolute left-1.5 top-1.5 rounded-md bg-scrim px-1.5 py-0.5 text-[10px] font-bold text-foreground backdrop-blur">E{i + 1}</span>
        </div>
        <div className="min-w-0 flex-1"><p className="truncate font-semibold">{e.title}</p><div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><Chip tone={e.is_published ? "success" : "neutral"}>{e.is_published ? "Published" : "Draft"}</Chip>{e.is_free ? <Chip tone="brand">Free</Chip> : null}<span>{minutes(e.duration_seconds)}</span></div></div>
        <div className="flex gap-2"><Link className={editActionClass} to="/admin/series/$id/episodes/$episodeId" params={{ id: seriesId, episodeId: e.id }} aria-label={`Edit ${e.title}`}><Pencil />Edit</Link><button type="button" className={deleteActionClass} disabled={busy} aria-label={`Delete ${e.title}`} onClick={() => setRemove({ id: e.id, title: e.title })}><Trash2 />Delete</button></div>
      </div>;
    }} /> : <div className="rounded-2xl border border-dashed border-primary/25 bg-background/50 px-6 py-12 text-center"><p className="text-sm font-bold">No episodes yet</p><p className="mt-1 text-sm text-muted-foreground">Use the New episode button above.</p></div>}
    <ConfirmDialog open={Boolean(remove)} onClose={() => !busy && setRemove(null)} title={`Delete ${remove?.title ?? "episode"}?`} description="This removes the episode and its video link. This action cannot be undone." confirmLabel="Delete" destructive busy={busy} onConfirm={() => remove && void run(() => deleteAdminContent({ data: { id: remove.id, kind: "episodes" } }), "Episode deleted")} />
  </Panel>;
}
