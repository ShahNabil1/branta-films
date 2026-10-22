import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useBlocker } from "@tanstack/react-router";
import { Save, Upload, Check, ImagePlus, Trash2, Loader2, Pencil, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Field, ToggleField } from "./AdminKit";
import { EpisodesPanel } from "./EpisodesPanel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addGenre, GENRE_OPTIONS, initialReleaseYear, MATURITY_OPTIONS } from "@/lib/series-metadata";
import { RichTextEditor } from "./RichTextEditor";
import { adminQuery } from "@/lib/admin-queries";
import { saveAdminEpisode, saveAdminSeries, uploadAdminImage } from "@/lib/admin.functions";
import { mediaUrl } from "@/lib/media";
import { isDirty } from "@/lib/dirty";
import { ARTWORK_SPECS, type ArtworkSlot } from "@/lib/artwork";
import { ImageCropDialog } from "./ImageCropDialog";
import { AdminEpisodeVideo } from "./AdminEpisodeVideo";
import { useVideoUpload } from "@/hooks/use-video-upload";
import { VideoUploadStatus } from "./VideoUploadStatus";
import { BrandedDialog } from "@/components/ui/branded-dialog";
import { ContentSeoFields } from "./ContentSeoFields";

export function ContentEditor({ kind, id, seriesId }: { kind: "series" | "episodes"; id: string; seriesId?: string }) {
  const { data } = useSuspenseQuery(adminQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const existing = kind === "series" ? data.series.find((s) => s.id === id) : data.episodes.find((e) => e.id === id);
  const series = data.series.find((s) => s.id === id);
  const episode = data.episodes.find((e) => e.id === id);
  const rawHtml = series?.description_html ?? episode?.synopsis_html ?? "";
  // The editor re-serialises stored HTML; its first output becomes the saved baseline.
  const [baseHtml, setBaseHtml] = useState<string | null>(null);
  const initial = {
    title: existing?.title ?? "", slug: series?.slug ?? "", tagline: series?.tagline ?? "", html: baseHtml ?? rawHtml,
    genres: series?.genres ?? [], year: initialReleaseYear(series?.release_year, id === "new"), maturity: series?.maturity_rating ?? "13+", price: series?.price_bdt ?? 0, epPrice: episode?.price_bdt?.toString() ?? "",
    order: series?.sort_order ?? (Math.max(0, ...data.series.map((s) => s.sort_order)) + 10), featured: series?.is_featured ?? false, published: existing?.is_published ?? false,
    parent: episode?.series_id ?? seriesId ?? "", number: episode?.episode_number ?? (Math.max(0, ...data.episodes.filter((e) => e.series_id === seriesId).map((e) => e.episode_number)) + 1),
    free: episode?.is_free ?? false, poster: series?.poster_url ?? null as string | null, backdrop: series?.backdrop_url ?? null as string | null,
    thumbnail: episode?.thumbnail_url ?? null as string | null,
    metaTitle: existing?.meta_title ?? "", metaDescription: existing?.meta_description ?? "", ogTitle: existing?.og_title ?? "", ogDescription: existing?.og_description ?? "", ogImage: existing?.og_image ?? null as string | null,
  };
  const [values, setValues] = useState(initial);
  const [saving, setBusy] = useState(false);
  const upload = useVideoUpload(id, async cleanupPending => {
    await Promise.all([qc.invalidateQueries({ queryKey: ["admin-episode-media", id] }), qc.invalidateQueries({ queryKey: adminQuery.queryKey }), qc.invalidateQueries({ queryKey: ["catalog"] })]);
    if (cleanupPending) toast.warning("Video saved. Old file cleanup will retry on your next episode visit.");
    else toast.success("Video uploaded");
  });
  const busy = saving || upload.active;
  const blocker = useBlocker({ shouldBlockFn: () => upload.active, disabled: !upload.active, enableBeforeUnload: upload.active, withResolver: true });
  const [editing, setEditing] = useState(id === "new");
  const [cropping, setCropping] = useState<{ file: File; slot: ArtworkSlot } | null>(null);
  const [pendingGenre, setPendingGenre] = useState("");
  const genreOptions = [...new Set([...GENRE_OPTIONS, ...data.series.flatMap(s => s.genres)])].sort();
  const maturityOptions = [...new Set([...MATURITY_OPTIONS, ...data.series.map(s => s.maturity_rating)])].filter(Boolean);
  const changed = isDirty(values, initial);
  const discountError = kind === "episodes" && !values.free && values.epPrice.trim() !== "" && !(Number.isInteger(Number(values.epPrice)) && Number(values.epPrice) >= 1) ? "Enter a whole amount of at least ৳1." : null;
  const onEditorReady = (html: string) => { setBaseHtml(html); setValues((v) => (v.html === rawHtml ? { ...v, html } : v)); };
  const cancel = () => { setValues(initial); setPendingGenre(""); setEditing(false); };
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((v) => ({ ...v, [key]: value }));
  const parentSeries = data.series.find((s) => s.id === (episode?.series_id ?? seriesId));
  if ((id !== "new" && !existing) || (kind === "episodes" && (!parentSeries || (episode && episode.series_id !== seriesId)))) return <Panel title="Content not found"><Button asChild variant="outline"><Link to="/admin/series">Back to series</Link></Button></Panel>;
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const seo = { meta_title: values.metaTitle, meta_description: values.metaDescription, og_title: values.ogTitle, og_description: values.ogDescription, og_image: values.ogImage };
      const row = kind === "series" ? await saveAdminSeries({ data: {
        ...seo,
        ...(id === "new" ? {} : { id }), title: values.title, slug: values.slug, tagline: values.tagline, description_html: values.html,
        genres: values.genres, release_year: values.year ? Number(values.year) : null,
        maturity_rating: values.maturity, price_bdt: values.price, sort_order: values.order, is_featured: values.featured, is_published: values.published,
        poster_url: values.poster, backdrop_url: values.backdrop,
      } }) : await saveAdminEpisode({ data: {
        ...seo,
        ...(id === "new" ? {} : { id }), series_id: values.parent, title: values.title, episode_number: values.number,
        synopsis_html: values.html, is_free: values.free, price_bdt: values.free || values.epPrice.trim() === "" ? null : Number(values.epPrice), is_published: values.published, thumbnail_url: values.thumbnail,
      } });
      await qc.invalidateQueries({ queryKey: adminQuery.queryKey });
      await qc.invalidateQueries({ queryKey: ["catalog"] });
      await Promise.all([qc.invalidateQueries({ queryKey: ["series"] }), qc.invalidateQueries({ queryKey: ["episode-details"] })]);
      toast.success("Content saved");
      setEditing(false);
      if (kind === "series") await navigate({ to: "/admin/series/$id", params: { id: row.id }, replace: true });
      else await navigate({ to: "/admin/series/$id/episodes/$episodeId", params: { id: values.parent, episodeId: row.id }, replace: true });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not save content"); }
    finally { setBusy(false); }
  }
  function pickImage(file: File | undefined, slot: ArtworkSlot) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 25 * 1024 * 1024) { toast.error("Choose a JPG, PNG or WebP image under 25 MB."); return; }
    setCropping({ file, slot });
  }
  async function uploadCropped(blob: Blob, slot: ArtworkSlot) {
    try {
      const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.onerror = reject; reader.readAsDataURL(blob); });
      const result = await uploadAdminImage({ data: { kind, id: id === "new" ? crypto.randomUUID() : id, slot, contentType: "image/webp", base64 } });
      set(slot, result.key); setCropping(null);
      toast.success("Image uploaded");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
  }
  async function video(file: File | undefined) {
    if (!file) return;
    try { await upload.start(file); } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
  }
  const field = (label: string, key: "title" | "slug") => <Field label={label}><Input className="admin-input" aria-label={label} value={values[key]} required onChange={(e) => set(key, e.target.value)} /></Field>;
  const numeric = (label: string, key: "price" | "order" | "number", min: number) => <Field label={label}><Input className="admin-input" aria-label={label} type="number" min={min} value={values[key]} onChange={(e) => set(key, Number(e.target.value))} /></Field>;
  const toggle = (label: string, key: "published" | "featured" | "free") => <ToggleField label={label} checked={values[key]} onChange={(v) => set(key, v)} />;

  const slots = kind === "series" ? ["poster", "backdrop"] as const : ["thumbnail"] as const;
  return <>
    <PageHeader back={kind === "series" ? { to: "/admin/series", label: "Series" } : { to: `/admin/series/${values.parent}` as "/admin/series", label: parentSeries?.title ?? "Series" }} title={`${id === "new" ? "New" : "Edit"} ${kind === "series" ? "series" : "episode"}`} description={existing?.title ?? "Fill in the details and save."} action={id === "new" ? undefined : editing ? <Button type="button" variant="outline" onClick={cancel} disabled={busy}><X />Cancel</Button> : <Button type="button" onClick={() => setEditing(true)} className="transition-all duration-200 hover:-translate-y-0.5"><Pencil />Edit</Button>} />
    {kind === "series" && id !== "new" ? <EpisodesPanel seriesId={id} /> : null}
    <form onSubmit={save} className="space-y-6">
      <div className="min-w-0 space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          <fieldset disabled={!editing || busy} className="min-w-0 space-y-6 disabled:[&_input]:cursor-not-allowed disabled:[&_input]:opacity-80">
          <Panel title="Details" description="What viewers see on the series page."><div className="grid gap-4 sm:grid-cols-2">{field("Title", "title")}
            {kind === "series" ? <>{field("Slug", "slug")}
              <Field label="Tagline" className="sm:col-span-2"><Textarea className="admin-input min-h-28 resize-y" aria-label="Tagline" rows={4} maxLength={500} value={values.tagline} onChange={e=>set("tagline",e.target.value)}/></Field>
              <div className="space-y-2 sm:col-span-2"><span className="block text-xs font-semibold text-muted-foreground">Genres</span><div className="flex min-w-0 gap-2">
                <Select value={pendingGenre} onValueChange={setPendingGenre} disabled={!editing || busy}><SelectTrigger aria-label="Choose genre" className="admin-input min-w-0 flex-1"><SelectValue placeholder="Choose genre"/></SelectTrigger><SelectContent className="admin-theme">{genreOptions.filter(g=>!values.genres.some(selected=>selected.toLowerCase()===g.toLowerCase())).map(g=><SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                <Button type="button" size="icon" aria-label="Add genre" title="Add genre" disabled={!editing || busy || !pendingGenre} onClick={()=>{set("genres",addGenre(values.genres,pendingGenre));setPendingGenre("");}}><Plus/></Button>
              </div><div className="flex flex-wrap gap-2">{values.genres.map(g=><span key={g} className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1 text-sm font-medium text-accent-foreground ring-1 ring-primary/20"><span className="break-words">{g}</span><Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" aria-label={`Remove ${g}`} disabled={!editing || busy} onClick={()=>set("genres",values.genres.filter(selected=>selected!==g))}><X className="size-3.5"/></Button></span>)}</div></div>
              <Field label="Release year"><Input className="admin-input" aria-label="Release year" type="number" min={1900} max={2200} step={1} value={values.year} onChange={e=>set("year",e.target.value)}/></Field>
              <Field label="Maturity rating"><Select value={values.maturity} onValueChange={v=>set("maturity",v)} disabled={!editing || busy}><SelectTrigger aria-label="Maturity rating" className="admin-input"><SelectValue/></SelectTrigger><SelectContent className="admin-theme">{maturityOptions.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></Field>
            </> : <>
              {numeric("Episode number", "number", 1)}
            </>}
          </div></Panel>
          <Panel title={kind === "series" ? "Description" : "Synopsis"}><RichTextEditor value={values.html} onChange={(html) => set("html", html)} onReady={onEditorReady} editable={editing} /></Panel>
          <ContentSeoFields values={values} onChange={seo => setValues(v => ({ ...v, ...seo }))} content={{ title: values.title, description_html: values.html, tagline: values.tagline, poster_url: values.poster, backdrop_url: values.backdrop, thumbnail_url: values.thumbnail }} episode={kind === "episodes" ? { seriesTitle: parentSeries?.title ?? "", number: values.number, fallbackImage: parentSeries?.backdrop_url ?? parentSeries?.poster_url ?? null } : undefined} onImage={file => pickImage(file, "ogImage")} />
          </fieldset>
          {kind === "episodes" ? <Panel title="Episode video" description="Any size MP4, sent in resumable parts and stored privately.">{id === "new" ? <p className="text-sm text-muted-foreground">Save this episode to upload its video.</p> : <div className="space-y-4">
            <AdminEpisodeVideo episodeId={id} title={values.title} thumbnail={values.thumbnail} editing={editing} busy={busy} onUpload={video} />
            {upload.resumable && !upload.active ? <div role="status" className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 break-words"><span className="font-semibold">Interrupted upload found:</span> {upload.resumable.name} — {Math.round(Math.min(100, (upload.resumable.done.length * upload.resumable.partSize / upload.resumable.size) * 100))}% sent. Choose the same file again to continue from there.</p>
              <Button type="button" variant="outline" size="sm" onClick={upload.discard}>Discard</Button>
            </div> : null}
            <VideoUploadStatus status={upload.status} onRetry={() => void upload.retry()} />
          </div>}</Panel> : null}
        </div>
        <fieldset disabled={!editing || busy} className="min-w-0 space-y-6">
          <Panel title="Visibility"><div className="space-y-2.5">{toggle("Published", "published")}{kind === "series" ? toggle("Featured", "featured") : toggle("Free episode", "free")}</div>{kind === "series" ? <div className="mt-4 grid gap-4">{numeric("Full series price (BDT)", "price", 0)}<p className="-mt-2 text-xs text-muted-foreground">Discounts are attached through <Link to="/admin/coupons" className="font-semibold text-primary hover:underline">Coupons</Link> and apply automatically in the cart.</p></div> : values.free ? null : <div className="mt-4 grid gap-2"><Field label="Single episode price (BDT)"><Input className="admin-input" aria-label="Single episode price (BDT)" type="number" min={1} step={1} placeholder="Only sold with the full series" value={values.epPrice} onChange={(e) => set("epPrice", e.target.value)} /></Field>{discountError ? <p className="text-xs font-semibold text-destructive">{discountError}</p> : <p className="text-xs text-muted-foreground">{values.epPrice.trim() === "" ? "Leave empty to sell this episode only with the full series." : "Viewers can buy this episode on its own. Add discounts with Coupons."}</p>}</div>}</Panel>
          <Panel title="Artwork" description="JPG, PNG or WebP. You can crop and zoom before upload."><div className="space-y-5">{slots.map((slot) => <div key={slot} className="space-y-2">
            <div className="flex items-baseline justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{ARTWORK_SPECS[slot].label}</p><p className="text-[11px] tabular-nums text-muted-foreground">Best {ARTWORK_SPECS[slot].width} × {ARTWORK_SPECS[slot].height} · {ARTWORK_SPECS[slot].ratio}</p></div>
            <div className={cn("group relative overflow-hidden rounded-xl border border-border bg-muted", slot === "poster" ? "aspect-[2/3]" : "aspect-video")}>
              {values[slot] ? <img src={mediaUrl(values[slot]) ?? undefined} alt={slot} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="grid size-full place-items-center text-muted-foreground"><ImagePlus className="size-6" /></div>}
            </div>
            {slot === "thumbnail" && !values.thumbnail ? <p className="text-xs text-muted-foreground">No episode thumbnail saved.</p> : null}
            <div className="flex flex-wrap gap-2">
              <label className={cn("inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted", busy && "pointer-events-none opacity-60")}>
                <Upload className="size-3.5" />{values[slot] ? "Replace" : "Upload"}
                <input type="file" className="sr-only" aria-label={`Upload ${slot}`} accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => { pickImage(e.target.files?.[0], slot); e.target.value = ""; }} />
              </label>
              {values[slot] ? <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => set(slot, null)} className="border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" />Remove</Button> : null}
            </div>
          </div>)}</div></Panel>
        </fieldset>
      </div>
      </div>
      {editing ? <div className="admin-rise sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur-md">
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><span className={cn("size-2 rounded-full", changed ? "bg-primary" : "bg-success")} />{changed ? "Unsaved changes" : "All changes saved"}</p>
        <Button type="submit" variant={changed ? "default" : "outline"} disabled={busy || !changed || !values.title.trim() || Boolean(discountError)} className={cn("transition-all duration-200", changed && "hover:-translate-y-0.5")}>{busy ? <Loader2 className="animate-spin" /> : changed ? <Save /> : <Check />}{busy ? "Saving…" : changed ? "Save changes" : "No changes"}</Button>
      </div> : null}
    </form>
    <BrandedDialog open={blocker.status === "blocked"} onClose={() => blocker.reset?.()} title="Video upload in progress" description="Leaving this page would interrupt the upload. Keep this page open until the video is saved."><Button type="button" onClick={() => blocker.reset?.()}>Stay on this page</Button></BrandedDialog>
    <ImageCropDialog file={cropping?.file ?? null} slot={cropping?.slot ?? "poster"} onClose={() => setCropping(null)} onDone={async (blob) => { if (cropping) await uploadCropped(blob, cropping.slot); }} />
  </>;
}