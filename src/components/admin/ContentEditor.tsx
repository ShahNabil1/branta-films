import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Save, Upload, ArrowLeft, Film } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/dashboard/DashboardKit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "./RichTextEditor";
import { adminQuery } from "@/lib/admin-queries";
import { saveAdminEpisode, saveAdminSeries, uploadAdminImage, prepareAdminVideo, finishAdminVideo } from "@/lib/admin.functions";
import { mediaUrl } from "@/lib/media";

export function ContentEditor({ kind, id }: { kind: "series" | "episodes"; id: string }) {
  const { data } = useSuspenseQuery(adminQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const existing = kind === "series" ? data.series.find((s) => s.id === id) : data.episodes.find((e) => e.id === id);
  const series = data.series.find((s) => s.id === id);
  const episode = data.episodes.find((e) => e.id === id);
  const initial = {
    title: existing?.title ?? "", slug: series?.slug ?? "", tagline: series?.tagline ?? "", html: series?.description_html ?? episode?.synopsis_html ?? "",
    genres: series?.genres.join(", ") ?? "", year: series?.release_year?.toString() ?? "", maturity: series?.maturity_rating ?? "13+", price: series?.price_bdt ?? 0,
    order: series?.sort_order ?? 0, featured: series?.is_featured ?? false, published: existing?.is_published ?? false,
    parent: episode?.series_id ?? data.series[0]?.id ?? "", number: episode?.episode_number ?? 1, duration: episode?.duration_seconds ?? 0,
    free: episode?.is_free ?? false, poster: series?.poster_url ?? null as string | null, backdrop: series?.backdrop_url ?? null as string | null,
    thumbnail: episode?.thumbnail_url ?? null as string | null,
  };
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const changed = JSON.stringify(values) !== JSON.stringify(initial);
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((v) => ({ ...v, [key]: value }));
  if (id !== "new" && !existing) return <Panel title="Content not found"><Button asChild variant="outline"><Link to={kind === "series" ? "/admin/series" : "/admin/episodes"}>Back to list</Link></Button></Panel>;
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
      await navigate({ to: kind === "series" ? "/admin/series/$id" : "/admin/episodes/$id", params: { id: row.id }, replace: true });
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
  const field = (label: string, key: "title" | "slug" | "tagline" | "genres" | "year" | "maturity") => <label className="block space-y-2"><span className="text-small font-medium">{label}</span><Input aria-label={label} value={values[key]} required={key === "title" || key === "slug"} onChange={(e) => set(key, e.target.value)} /></label>;
  const numeric = (label: string, key: "price" | "order" | "number" | "duration", min: number) => <label className="block space-y-2"><span className="text-small font-medium">{label}</span><Input aria-label={label} type="number" min={min} value={values[key]} onChange={(e) => set(key, Number(e.target.value))} /></label>;
  const toggle = (label: string, key: "published" | "featured" | "free") => <label className="flex items-center gap-3 text-small"><input className="size-4 accent-primary" type="checkbox" checked={values[key]} onChange={(e) => set(key, e.target.checked)} />{label}</label>;
  return <>
    <PageHeader title={`${id === "new" ? "New" : "Edit"} ${kind === "series" ? "series" : "episode"}`} icon={Film} action={<Button asChild variant="outline"><Link to={kind === "series" ? "/admin/series" : "/admin/episodes"}><ArrowLeft />Back</Link></Button>} />
    <form onSubmit={save} className="space-y-6">
      <Panel title="Details"><div className="grid gap-5 sm:grid-cols-2">{field("Title", "title")}
        {kind === "series" ? <>{field("Slug", "slug")}{field("Tagline", "tagline")}{field("Genres (comma separated)", "genres")}{field("Release year", "year")}{field("Maturity rating", "maturity")}{numeric("Price (BDT)", "price", 0)}{numeric("Sort order", "order", -10000)}</> : <>
          <label className="block space-y-2"><span className="text-small font-medium">Series</span><select aria-label="Series" required className="w-full rounded-md border border-input bg-background p-3" value={values.parent} onChange={(e) => set("parent", e.target.value)}>{data.series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
          {numeric("Episode number", "number", 1)}{numeric("Duration (seconds)", "duration", 0)}
        </>}
      </div><div className="mt-6 flex flex-wrap gap-6">{toggle("Published", "published")}{kind === "series" ? toggle("Featured", "featured") : toggle("Free episode", "free")}</div></Panel>
      <Panel title={kind === "series" ? "Description" : "Synopsis"}><RichTextEditor value={values.html} onChange={(html) => set("html", html)} /></Panel>
      <Panel title="Artwork"><div className="grid gap-6 sm:grid-cols-2">{(kind === "series" ? ["poster", "backdrop"] as const : ["thumbnail"] as const).map((slot) => <div key={slot} className="space-y-3">
        <p className="text-small font-medium capitalize">{slot}</p>{values[slot] ? <img src={mediaUrl(values[slot]) ?? undefined} alt={slot} className="h-48 max-w-full rounded-md object-contain" /> : <div className="grid h-48 place-items-center rounded-md bg-muted text-muted-foreground"><Film className="size-8" /></div>}
        <Input aria-label={`Upload ${slot}`} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => void image(e.target.files?.[0], slot)} />
        {values[slot] ? <Button variant="ghost" type="button" disabled={busy} onClick={() => set(slot, null)}>Remove image</Button> : null}
      </div>)}</div></Panel>
      {kind === "episodes" ? <Panel title="Episode video">{id === "new" ? <p className="text-small text-muted-foreground">Save this episode to upload its video.</p> : <div className="space-y-4"><Input type="file" aria-label="Upload episode video" accept="video/mp4" disabled={busy} onChange={(e) => void video(e.target.files?.[0])} />{progress !== null ? <div className="flex items-center gap-3"><Upload className="size-4 text-primary" /><progress max={100} value={progress} className="w-full" /><span>{progress}%</span></div> : null}{videoUploaded ? <p className="text-small text-success">Video saved securely in R2.</p> : null}</div>}</Panel> : null}
      <div className="sticky bottom-0 flex justify-end border-t border-border bg-surface/95 p-4 backdrop-blur-sm"><Button type="submit" disabled={busy || !changed || !values.title.trim()}><Save />{busy ? "Please wait…" : "Save changes"}</Button></div>
    </form>
  </>;
}