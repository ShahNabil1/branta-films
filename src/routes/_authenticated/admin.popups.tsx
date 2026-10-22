import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, Panel, Chip, Field, ToggleField, editActionClass, deleteActionClass } from "@/components/admin/AdminKit";
import { ConfirmDialog } from "@/components/ui/branded-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminQuery } from "@/lib/admin-queries";
import { deleteAdminPopup, listAdminPopups, saveAdminPopup, uploadAdminPopupImage } from "@/lib/commerce-admin.functions";
import { isDirty } from "@/lib/dirty";
import { mediaUrl } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/admin/popups")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Popups — Branta Films Admin" }, { name: "description", content: "Schedule promotional image popups for the site and dashboard." },
    { property: "og:title", content: "Popups — Branta Films Admin" }, { property: "og:description", content: "Branta Films administrator workspace." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: PopupsAdmin,
});

type Row = Awaited<ReturnType<typeof listAdminPopups>>[number];
type Draft = { id?: string; title: string; image_key: string | null; alt: string; action_type: "none" | "url" | "series" | "episode"; action_url: string; action_target: string; placement: "site" | "dashboard" | "everywhere"; delay_seconds: number; frequency: "session" | "once" | "every_visit"; starts_at: string; ends_at: string; is_active: boolean };
const empty = (): Draft => ({ title: "", image_key: null, alt: "", action_type: "none", action_url: "", action_target: "", placement: "site", delay_seconds: 5, frequency: "session", starts_at: "", ends_at: "", is_active: false });
const local = (iso: string | null) => { if (!iso) return ""; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const PLACEMENT = { site: "Public site", dashboard: "Viewer dashboard", everywhere: "Site + dashboard" };
const FREQ = { session: "Once per visit (session)", once: "Only once ever", every_visit: "Every page load" };
const selectCls = "admin-input w-full border px-3 text-sm";

function PopupsAdmin() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAdminPopups);
  const delFn = useServerFn(deleteAdminPopup);
  const { data = [], isPending } = useQuery({ queryKey: ["admin", "popups"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<{ draft: Draft; isNew: boolean } | null>(null);
  const [del, setDel] = useState<Row | null>(null);
  const reload = () => Promise.all([qc.invalidateQueries({ queryKey: ["admin", "popups"] }), qc.invalidateQueries({ queryKey: ["popups"] })]);
  const remove = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: async () => { toast.success("Popup deleted"); setDel(null); await reload(); }, onError: (e: Error) => toast.error(e.message) });
  const toDraft = (r: Row): Draft => ({ id: r.id, title: r.title, image_key: r.image_key, alt: r.alt, action_type: r.action_type as Draft["action_type"], action_url: r.action_url ?? "", action_target: r.action_target ?? "", placement: r.placement as Draft["placement"], delay_seconds: r.delay_seconds, frequency: r.frequency as Draft["frequency"], starts_at: local(r.starts_at), ends_at: local(r.ends_at), is_active: r.is_active });

  if (editing) return <PopupEditor key={editing.draft.id ?? "new"} draft={editing.draft} isNew={editing.isNew} onDone={async () => { setEditing(null); await reload(); }} onCancel={() => setEditing(null)} />;
  return <div className="space-y-5">
    <PageHeader title="Popups" description="Image popups that appear after a delay on the site or viewer dashboard. Several can run one after another." action={<Button onClick={() => setEditing({ draft: empty(), isNew: true })}><Plus />New popup</Button>} />
    <Panel>
      {isPending ? <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" /> : data.length === 0 ? <div className="py-10 text-center"><Megaphone className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">No popups yet</p></div> :
        <ul className="space-y-3">{data.map((p) => <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/60 p-2.5 sm:flex-nowrap">
          {p.image_key ? <img src={mediaUrl(p.image_key) ?? undefined} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-border" /> : <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-muted"><ImagePlus className="size-4 text-muted-foreground" /></span>}
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{p.title}</p><p className="mt-1 text-xs text-muted-foreground">{PLACEMENT[p.placement as Draft["placement"]]} · after {p.delay_seconds}s · {FREQ[p.frequency as Draft["frequency"]]}{p.action_type !== "none" ? ` · ${p.action_type === "url" ? "opens link" : "Purchase now"}` : ""}</p></div>
          <Chip tone={p.is_active ? "success" : "neutral"}>{p.is_active ? "Active" : "Off"}</Chip>
          <div className="flex gap-2"><button type="button" className={editActionClass} onClick={() => setEditing({ draft: toDraft(p), isNew: false })}><Pencil />Edit</button><button type="button" className={deleteActionClass} onClick={() => setDel(p)}><Trash2 />Delete</button></div>
        </li>)}</ul>}
    </Panel>
    <ConfirmDialog open={Boolean(del)} onClose={() => setDel(null)} title={`Delete “${del?.title ?? ""}”?`} description="The popup and its image are removed permanently." confirmLabel="Delete" destructive busy={remove.isPending} onConfirm={() => del && remove.mutate(del.id)} />
  </div>;
}

function PopupEditor({ draft, isNew, onDone, onCancel }: { draft: Draft; isNew: boolean; onDone: () => void | Promise<void>; onCancel: () => void }) {
  const { data } = useSuspenseQuery(adminQuery);
  const saveFn = useServerFn(saveAdminPopup);
  const uploadFn = useServerFn(uploadAdminPopupImage);
  const [d, setD] = useState(draft);
  const [editing, setEditing] = useState(isNew);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const changed = isDirty(d, draft);
  const save = useMutation({
    mutationFn: () => saveFn({ data: { id: d.id ?? null, title: d.title, image_key: d.image_key, alt: d.alt, action_type: d.action_type, action_url: d.action_url || null, action_target: d.action_target || null, placement: d.placement, delay_seconds: d.delay_seconds, frequency: d.frequency, starts_at: d.starts_at ? new Date(d.starts_at).toISOString() : null, ends_at: d.ends_at ? new Date(d.ends_at).toISOString() : null, is_active: d.is_active } }),
    onSuccess: async () => { toast.success(isNew ? "Popup created" : "Popup saved"); await onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Use a JPG, PNG or WebP image."); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8 MB."); return; }
    setUploading(true);
    try {
      const buf = new Uint8Array(await file.arrayBuffer()); let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      const { key } = await uploadFn({ data: { contentType: file.type as "image/png", base64: btoa(bin) } });
      set("image_key", key);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); } finally { setUploading(false); }
  }
  const seriesById = new Map(data.series.map((s) => [s.id, s.title]));
  return <div className="space-y-5">
    <PageHeader title={isNew ? "New popup" : d.title || "Popup"} back={{ to: "/admin/popups", label: "Popups" }} action={!editing ? <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil />Edit</Button> : null} />
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <fieldset disabled={!editing || save.isPending} className="min-w-0 space-y-5">
        <Panel title="Content">
          <div className="grid gap-4">
            <Field label="Internal title"><Input className="admin-input" required maxLength={120} value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="Eid offer — homepage" /></Field>
            <Field label="Image description (for screen readers)"><Input className="admin-input" maxLength={200} value={d.alt} onChange={(e) => set("alt", e.target.value)} /></Field>
            <Field label="On click"><select className={selectCls} value={d.action_type} onChange={(e) => set("action_type", e.target.value as Draft["action_type"])}><option value="none">Nothing (close only)</option><option value="url">Open a link</option><option value="series">Purchase now — add a series to cart</option><option value="episode">Purchase now — add an episode to cart</option></select></Field>
            {d.action_type === "url" ? <Field label="Link" hint="A page on this site (/browse) or a full https:// address"><Input className="admin-input" value={d.action_url} onChange={(e) => set("action_url", e.target.value.trim())} placeholder="/series/my-show" /></Field> : null}
            {d.action_type === "series" ? <Field label="Series"><select className={selectCls} value={d.action_target} onChange={(e) => set("action_target", e.target.value)}><option value="">Choose…</option>{data.series.filter((s) => s.price_bdt > 0).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></Field> : null}
            {d.action_type === "episode" ? <Field label="Episode" hint="Only episodes with their own price"><select className={selectCls} value={d.action_target} onChange={(e) => set("action_target", e.target.value)}><option value="">Choose…</option>{data.episodes.filter((e) => !e.is_free && e.price_bdt).map((e) => <option key={e.id} value={e.id}>{seriesById.get(e.series_id)} · Ep {e.episode_number}: {e.title}</option>)}</select></Field> : null}
          </div>
        </Panel>
        <Panel title="When it shows">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Where"><select className={selectCls} value={d.placement} onChange={(e) => set("placement", e.target.value as Draft["placement"])}>{Object.entries(PLACEMENT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="Delay (seconds after entering)"><Input className="admin-input" type="number" min={0} max={600} value={d.delay_seconds} onChange={(e) => set("delay_seconds", Math.max(0, Math.min(600, Math.round(Number(e.target.value) || 0))))} /></Field>
            <Field label="How often" className="sm:col-span-2"><select className={selectCls} value={d.frequency} onChange={(e) => set("frequency", e.target.value as Draft["frequency"])}>{Object.entries(FREQ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="Show from"><Input className="admin-input" type="datetime-local" value={d.starts_at} onChange={(e) => set("starts_at", e.target.value)} /></Field>
            <Field label="Show until"><Input className="admin-input" type="datetime-local" value={d.ends_at} onChange={(e) => set("ends_at", e.target.value)} /></Field>
          </div>
        </Panel>
      </fieldset>
      <div className="space-y-5">
        <Panel title="Image" description="Portrait or square works best, e.g. 1080×1350.">
          <div className="grid aspect-[4/5] place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40">{d.image_key ? <img src={mediaUrl(d.image_key) ?? undefined} alt="" className="size-full object-contain" /> : <ImagePlus className="size-8 text-muted-foreground" />}</div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
          <Button type="button" variant="outline" className="mt-3 w-full" disabled={!editing || uploading} onClick={() => fileRef.current?.click()}>{uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}{d.image_key ? "Replace image" : "Upload image"}</Button>
        </Panel>
        <Panel><fieldset disabled={!editing || save.isPending}><ToggleField label="Active" checked={d.is_active} onChange={(v) => set("is_active", v)} /></fieldset></Panel>
        {editing ? <div className="flex gap-2"><Button type="button" variant="outline" className="flex-1" onClick={() => (isNew ? onCancel() : (setD(draft), setEditing(false)))}>Cancel</Button><Button type="submit" className="flex-1" disabled={save.isPending || uploading || (!changed && !isNew) || !d.title.trim()}>{save.isPending ? <Loader2 className="animate-spin" /> : null}{isNew ? "Create" : changed ? "Save changes" : "No changes"}</Button></div> : null}
      </div>
    </form>
  </div>;
}
