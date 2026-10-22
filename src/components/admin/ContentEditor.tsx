import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Save, Upload, Check, ImagePlus, Trash2, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Field, ToggleField } from "./AdminKit";
import { EpisodesPanel } from "./EpisodesPanel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "./RichTextEditor";
import { adminQuery } from "@/lib/admin-queries";
import { saveAdminEpisode, saveAdminSeries, uploadAdminImage, prepareAdminVideo, finishAdminVideo } from "@/lib/admin.functions";
import { mediaUrl } from "@/lib/media";
import { isDirty } from "@/lib/dirty";

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
    genres: series?.genres.join(", ") ?? "", year: series?.release_year?.toString() ?? "", maturity: series?.maturity_rating ?? "13+", price: series?.price_bdt ?? 0,
    order: series?.sort_order ?? 0, featured: series?.is_featured ?? false, published: existing?.is_published ?? false,
    parent: episode?.series_id ?? seriesId ?? "", number: episode?.episode_number ?? (Math.max(0, ...data.episodes.filter((e) => e.series_id === seriesId).map((e) => e.episode_number)) + 1), duration: episode?.duration_seconds ?? 0,
    free: episode?.is_free ?? false, poster: series?.poster_url ?? null as string | null, backdrop: series?.backdrop_url ?? null as string | null,
    thumbnail: episode?.thumbnail_url ?? null as string | null,
  };
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [editing, setEditing] = useState(id === "new");
  const changed = isDirty(values, initial);
  const onEditorReady = (html: string) => { setBaseHtml(html); setValues((v) => (v.html === rawHtml ? { ...v, html } : v)); };
  const cancel = () => { setValues(initial); setEditing(false); };
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((v) => ({ ...v, [key]: value }));
  const parentSeries = data.series.find((s) => s.id === (episode?.series_id ?? seriesId));
  if ((id !== "new" && !existing) || (kind === "episodes" && (!parentSeries || (episode && episode.series_id !== seriesId)))) return <Panel title="Content not found"><Button asChild variant="outline"><Link to="/admin/series">Back to series</Link></Button></Panel>;
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const row = kind === "series" ? await saveAdminSeries({ data: {
        ...(id === "new" ? {} : { id }), title: values.title, slug: values.slug, tagline: values.tagline, description_html: values.html,
        genres: values.genres.split(",").map((g) => g.trim()).filter(Boolean), release_year: values.year ? Number(values.year) : null,
        maturity_rating: values.maturity, price_bdt: values.price, sort_order: values.order, is_featured: values.featured, is_published: values.published,
        poster_url: values.poster, backdrop_url: values.backdrop,
      } }) : await saveAdminEpisode({ data: {
        ...(id === "new" ? {} : { id }), series_id: values.parent, title: values.title, episode_number: values.number,
        synopsis_html: values.html, duration_seconds: values.duration, is_free: values.free, is_published: values.published, thumbnail_url: values.thumbnail,
      } });
      await qc.invalidateQueries({ queryKey: adminQuery.queryKey });
      await qc.invalidateQueries({ queryKey: ["catalog"] });
      toast.success("Content saved");
      setEditing(false);
      if (kind === "series") await navigate({ to: "/admin/series/$id", params: { id: row.id }, replace: true });
      else await navigate({ to: "/admin/series/$id/episodes/$episodeId", params: { id: values.parent, episodeId: row.id }, replace: true });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not save content"); }
    finally { setBusy(false); }
  }
  async function image(file: File | undefined, slot: "poster" | "backdrop" | "thumbnail") {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) { toast.error("Choose a JPG, PNG or WebP image under 10 MB."); return; }
    setBusy(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.onerror = reject; reader.readAsDataURL(file); });
      const result = await uploadAdminImage({ data: { kind, id: id === "new" ? crypto.randomUUID() : id, slot, contentType: file.type as "image/jpeg" | "image/png" | "image/webp", base64 } });
      set(slot, result.key);
      toast.success("Image uploaded");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
    finally { setBusy(false); }
  }
  async function video(file: File | undefined) {
    if (!file) return;
    if (file.type !== "video/mp4" || file.size > 5 * 1024 ** 3) { toast.error("Choose an MP4 video under 5 GB."); return; }
    setBusy(true); setProgress(0);
    try {
      const upload = await prepareAdminVideo({ data: { episodeId: id } });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest(); xhr.open("PUT", upload.url); xhr.setRequestHeader("Content-Type", "video/mp4");
        xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round(e.loaded / e.total * 100));
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Video upload failed. Check the R2 upload permissions."));
        xhr.onerror = () => reject(new Error("Video upload could not connect. Check R2 CORS allows this site to upload."));
        xhr.send(file);
      });
      await finishAdminVideo({ data: { episodeId: id, key: upload.key, size: file.size } });
      setVideoUploaded(true); toast.success("Video uploaded");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
    finally { setBusy(false); setProgress(null); }
  }
  const field = (label: string, key: "title" | "slug" | "tagline" | "genres" | "year" | "maturity") => <Field label={label}><Input className="admin-input" aria-label={label} value={values[key]} required={key === "title" || key === "slug"} onChange={(e) => set(key, e.target.value)} /></Field>;
  const numeric = (label: string, key: "price" | "order" | "number" | "duration", min: number) => <Field label={label}><Input className="admin-input" aria-label={label} type="number" min={min} value={values[key]} onChange={(e) => set(key, Number(e.target.value))} /></Field>;
  const toggle = (label: string, key: "published" | "featured" | "free") => <ToggleField label={label} checked={values[key]} onChange={(v) => set(key, v)} />;

  const slots = kind === "series" ? ["poster", "backdrop"] as const : ["thumbnail"] as const;
  return <>
    <PageHeader back={kind === "series" ? { to: "/admin/series", label: "Series" } : { to: `/admin/series/${values.parent}` as "/admin/series", label: parentSeries?.title ?? "Series" }} title={`${id === "new" ? "New" : "Edit"} ${kind === "series" ? "series" : "episode"}`} description={existing?.title ?? "Fill in the details and save."} action={id === "new" ? undefined : editing ? <Button type="button" variant="outline" onClick={cancel} disabled={busy}><X />Cancel</Button> : <Button type="button" onClick={() => setEditing(true)} className="transition-all duration-200 hover:-translate-y-0.5"><Pencil />Edit</Button>} />
    {kind === "series" && id !== "new" ? <EpisodesPanel seriesId={id} /> : null}
    <form onSubmit={save} className="space-y-6">
      <fieldset disabled={!editing} className="min-w-0 space-y-6 disabled:[&_input]:cursor-not-allowed disabled:[&_input]:opacity-80">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          <Panel title="Details" description="What viewers see on the series page."><div className="grid gap-4 sm:grid-cols-2">{field("Title", "title")}
            {kind === "series" ? <>{field("Slug", "slug")}{field("Tagline", "tagline")}{field("Genres (comma separated)", "genres")}{field("Release year", "year")}{field("Maturity rating", "maturity")}</> : <>
              {numeric("Episode number", "number", 1)}{numeric("Duration (seconds)", "duration", 0)}
            </>}
          </div></Panel>
          <Panel title={kind === "series" ? "Description" : "Synopsis"}><RichTextEditor value={values.html} onChange={(html) => set("html", html)} onReady={onEditorReady} editable={editing} /></Panel>
          {kind === "episodes" ? <Panel title="Episode video" description="MP4 up to 5 GB, stored privately.">{id === "new" ? <p className="text-sm text-muted-foreground">Save this episode to upload its video.</p> : <div className="space-y-4">
            <label className={cn("flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/25 bg-background/50 px-6 py-10 text-center transition-all duration-300 hover:border-primary/50 hover:bg-accent", busy && "pointer-events-none opacity-60")}>
              <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><Upload className="size-5" /></span><span className="text-sm font-bold">Choose video file</span><span className="text-xs text-muted-foreground">Click to browse your computer</span>
              <input type="file" className="sr-only" aria-label="Upload episode video" accept="video/mp4" disabled={busy} onChange={(e) => void video(e.target.files?.[0])} />
            </label>
            {progress !== null ? <div className="flex items-center gap-3 text-sm"><progress max={100} value={progress} className="admin-progress w-full" /><span className="tabular-nums">{progress}%</span></div> : null}
            {videoUploaded ? <p className="flex items-center gap-2 text-sm font-semibold text-success"><Check className="size-4" />Video saved securely.</p> : null}
          </div>}</Panel> : null}
        </div>
        <div className="space-y-6">
          <Panel title="Visibility"><div className="space-y-2.5">{toggle("Published", "published")}{kind === "series" ? toggle("Featured", "featured") : toggle("Free episode", "free")}</div>{kind === "series" ? <div className="mt-4 grid gap-4">{numeric("Price (BDT)", "price", 0)}{numeric("Sort order", "order", -10000)}</div> : null}</Panel>
          <Panel title="Artwork" description="JPG, PNG or WebP up to 10 MB."><div className="space-y-5">{slots.map((slot) => <div key={slot} className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{slot}</p>
            <div className={cn("group relative overflow-hidden rounded-xl border border-border bg-muted", slot === "poster" ? "aspect-[2/3]" : "aspect-video")}>
              {values[slot] ? <img src={mediaUrl(values[slot]) ?? undefined} alt={slot} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="grid size-full place-items-center text-muted-foreground"><ImagePlus className="size-6" /></div>}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className={cn("inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted", busy && "pointer-events-none opacity-60")}>
                <Upload className="size-3.5" />{values[slot] ? "Replace" : "Upload"}
                <input type="file" className="sr-only" aria-label={`Upload ${slot}`} accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => void image(e.target.files?.[0], slot)} />
              </label>
              {values[slot] ? <button type="button" disabled={busy} onClick={() => set(slot, null)} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive transition-all duration-200 hover:-translate-y-0.5 hover:bg-destructive/10 disabled:opacity-60"><Trash2 className="size-3.5" />Remove</button> : null}
            </div>
          </div>)}</div></Panel>
        </div>
      </div>
      </fieldset>
      {editing ? <div className="admin-rise sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur-md">
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><span className={cn("size-2 rounded-full", changed ? "bg-primary" : "bg-success")} />{changed ? "Unsaved changes" : "All changes saved"}</p>
        <Button type="submit" variant={changed ? "default" : "outline"} disabled={busy || !changed || !values.title.trim()} className={cn("transition-all duration-200", changed && "hover:-translate-y-0.5")}>{busy ? <Loader2 className="animate-spin" /> : changed ? <Save /> : <Check />}{busy ? "Saving…" : changed ? "Save changes" : "No changes"}</Button>
      </div> : null}
    </form>
  </>;
}