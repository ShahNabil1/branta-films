import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { BadgePercent, CalendarDays, Check, Film, Loader2, Package, Pencil, Percent, Plus, RotateCcw, Search, Ticket, Trash2, Users, X, RefreshCw } from "lucide-react";
import { PageHeader, Panel } from "@/components/admin/AdminKit";
import { ConfirmDialog } from "@/components/ui/branded-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminQuery } from "@/lib/admin-queries";
import { listAdminCoupons, saveAdminCoupon, setAdminCouponState } from "@/lib/commerce-admin.functions";
import { COUPON_CODE_RE, maskCouponCode } from "@/lib/cart-pricing";
import { isDirty } from "@/lib/dirty";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Coupons — Branta Films Admin" }, { name: "description", content: "Create and target coupons for series and episodes." },
    { property: "og:title", content: "Coupons — Branta Films Admin" }, { property: "og:description", content: "Branta Films administrator workspace." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: CouponsPage,
});

type AppliesTo = "all" | "series" | "episodes";
type Target = { target_type: "series" | "episode"; target_id: string };
type Row = Awaited<ReturnType<typeof listAdminCoupons>>[number];
type Draft = {
  id?: string; code: string; name: string; description: string; discount_type: "percent" | "flat"; discount_value: string; cap_amount: string;
  min_spend: string; max_uses_total: string; max_uses_per_customer: string; applies_to: AppliesTo; auto_apply: boolean;
  starts_at: string; ends_at: string; is_active: boolean; targets: Target[];
};
const emptyDraft = (): Draft => ({ code: "", name: "", description: "", discount_type: "percent", discount_value: "10", cap_amount: "", min_spend: "0", max_uses_total: "", max_uses_per_customer: "", applies_to: "episodes", auto_apply: true, starts_at: "", ends_at: "", is_active: true, targets: [] });
const local = (iso: string | null) => { if (!iso) return ""; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US")}`;
const inputClass = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary disabled:opacity-70";

function CouponsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAdminCoupons);
  const stateFn = useServerFn(setAdminCouponState);
  const coupons = useQuery({ queryKey: ["admin", "coupons"], queryFn: () => listFn() });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "deleted">("all");
  const [editing, setEditing] = useState<{ draft: Draft; isNew: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const reload = () => Promise.all([qc.invalidateQueries({ queryKey: ["admin", "coupons"] }), qc.invalidateQueries({ queryKey: ["offers"] }), qc.invalidateQueries({ queryKey: ["catalog"] })]);
  const state = useMutation({
    mutationFn: (v: { id: string; action: "activate" | "deactivate" | "delete" | "restore" }) => stateFn({ data: v }),
    onSuccess: async (_d, v) => { toast.success({ activate: "Coupon activated", deactivate: "Coupon deactivated", delete: "Coupon deleted", restore: "Coupon restored" }[v.action]); setConfirmDelete(null); await reload(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = coupons.data ?? [];
  const filtered = useMemo(() => {
    const now = Date.now(); const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle && !`${r.code} ${r.name}`.toLowerCase().includes(needle)) return false;
      if (filter === "deleted") return Boolean(r.deleted_at);
      if (r.deleted_at) return false;
      const expired = Boolean(r.ends_at && new Date(r.ends_at).getTime() < now);
      if (filter === "active") return r.is_active && !expired;
      if (filter === "inactive") return !r.is_active || expired;
      return true;
    });
  }, [rows, q, filter]);

  function beginEdit(r?: Row) {
    if (!r) return setEditing({ draft: emptyDraft(), isNew: true });
    setEditing({ isNew: false, draft: {
      id: r.id, code: r.code, name: r.name, description: r.description ?? "", discount_type: r.discount_type as Draft["discount_type"], discount_value: String(r.discount_value),
      cap_amount: r.cap_amount != null ? String(r.cap_amount) : "", min_spend: String(r.min_spend ?? 0), max_uses_total: r.max_uses_total != null ? String(r.max_uses_total) : "",
      max_uses_per_customer: r.max_uses_per_customer != null ? String(r.max_uses_per_customer) : "", applies_to: r.applies_to as AppliesTo, auto_apply: r.auto_apply,
      starts_at: local(r.starts_at), ends_at: local(r.ends_at), is_active: r.is_active, targets: r.targets as Target[],
    } });
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Coupons" description="Create, target and manage discounts for series and episodes." action={<Button onClick={() => beginEdit()} className="gap-1.5 active:scale-[0.97]"><Plus className="size-4" /> New Coupon</Button>} />
      <Panel className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="rounded-xl pl-9" placeholder="Search code or name…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {(["all", "active", "inactive", "deleted"] as const).map((k) => <button key={k} type="button" onClick={() => setFilter(k)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200 active:scale-95", filter === k ? "border-primary/40 bg-primary/10 text-primary" : "border-border hover:border-primary/30 hover:bg-accent")}>{k}</button>)}
      </Panel>
      <Panel className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="p-3 text-left">Code</th><th className="p-3 text-left">Discount</th><th className="p-3 text-left">Applies to</th><th className="p-3 text-left">Uses</th><th className="p-3 text-left">Validity</th><th className="p-3 text-left">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>
              {coupons.isLoading ? <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" /></td></tr> : null}
              {!coupons.isLoading && filtered.length === 0 ? <tr><td colSpan={7} className="p-10 text-center"><Ticket className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">No coupons here</p><p className="text-xs text-muted-foreground">Click “New Coupon” to create your first discount.</p></td></tr> : null}
              {filtered.map((r) => {
                const expired = Boolean(r.ends_at && new Date(r.ends_at).getTime() < Date.now());
                const label = r.deleted_at ? "Deleted" : expired ? "Expired" : r.is_active ? "Active" : "Inactive";
                const cls = r.deleted_at ? "bg-destructive/10 text-destructive ring-destructive/25" : expired ? "bg-primary/10 text-accent-foreground ring-primary/25" : r.is_active ? "bg-success/10 text-success ring-success/25" : "bg-muted text-muted-foreground ring-border";
                return <tr key={r.id} className="border-t border-border transition-colors hover:bg-accent/40">
                  <td className="p-3"><div className="flex items-center gap-1.5 font-mono text-sm font-bold tracking-wider">{r.code}{r.auto_apply ? <span title="Applies automatically" className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 font-sans text-[10px] font-bold tracking-normal text-primary"><RefreshCw className="size-3" />Auto</span> : null}</div><div className="text-xs text-muted-foreground">{r.name}</div></td>
                  <td className="p-3">{r.discount_type === "percent" ? `${r.discount_value}%${r.cap_amount ? ` (max ${bdt(r.cap_amount)})` : ""}` : `${bdt(r.discount_value)} off`}{r.min_spend > 0 ? <div className="text-[11px] text-muted-foreground">Min spend {bdt(r.min_spend)}</div> : null}</td>
                  <td className="p-3 text-xs capitalize">{r.applies_to === "all" ? "Everything" : `${r.applies_to} (${r.targets.length})`}</td>
                  <td className="p-3 text-xs tabular-nums">{r.uses_count}{r.max_uses_total ? ` / ${r.max_uses_total}` : ""}{r.max_uses_per_customer ? <div className="text-[11px] text-muted-foreground">{r.max_uses_per_customer}/viewer</div> : null}</td>
                  <td className="p-3 text-xs">{r.starts_at || r.ends_at ? <><div>{r.starts_at ? new Date(r.starts_at).toLocaleDateString() : "—"}</div><div className="text-muted-foreground">→ {r.ends_at ? new Date(r.ends_at).toLocaleDateString() : "∞"}</div></> : "No limit"}</td>
                  <td className="p-3"><span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1", cls)}>{label}</span></td>
                  <td className="p-3"><div className="flex items-center justify-end gap-1">
                    {r.deleted_at ? <IconAction title="Restore" onClick={() => state.mutate({ id: r.id, action: "restore" })} busy={state.isPending && state.variables?.id === r.id} className="text-success hover:bg-success/10"><RotateCcw className="size-4" /></IconAction> : <>
                      <IconAction title={r.is_active ? "Deactivate" : "Activate"} onClick={() => state.mutate({ id: r.id, action: r.is_active ? "deactivate" : "activate" })} busy={state.isPending && state.variables?.id === r.id}>{r.is_active ? <X className="size-4" /> : <Check className="size-4" />}</IconAction>
                      <IconAction title="Edit" onClick={() => beginEdit(r)}><Pencil className="size-4" /></IconAction>
                      <IconAction title="Delete" onClick={() => setConfirmDelete(r)} className="text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></IconAction>
                    </>}
                  </div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      {editing ? <CouponDialog draft={editing.draft} isNew={editing.isNew} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await reload(); }} /> : null}
      <ConfirmDialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title={`Delete coupon ${confirmDelete?.code ?? ""}?`} description="It stops applying immediately and can be restored later from the Deleted filter." confirmLabel="Delete" destructive busy={state.isPending} onConfirm={() => confirmDelete && state.mutate({ id: confirmDelete.id, action: "delete" })} />
    </div>
  );
}

function IconAction({ title, onClick, busy, className, children }: { title: string; onClick: () => void; busy?: boolean; className?: string; children: React.ReactNode }) {
  return <button type="button" title={title} aria-label={title} onClick={onClick} disabled={busy} className={cn("grid size-8 place-items-center rounded-lg border border-transparent transition-all duration-150 hover:border-border hover:bg-accent active:scale-90 disabled:opacity-50", className)}>{busy ? <Loader2 className="size-4 animate-spin" /> : children}</button>;
}

function CouponDialog({ draft, isNew, onClose, onSaved }: { draft: Draft; isNew: boolean; onClose: () => void; onSaved: () => void | Promise<void> }) {
  const { data } = useSuspenseQuery(adminQuery);
  const saveFn = useServerFn(saveAdminCoupon);
  const [d, setD] = useState<Draft>(draft);
  const [editing, setEditingMode] = useState(isNew);
  const [error, setError] = useState<string | null>(null);
  const changed = isDirty(d, draft);
  useEffect(() => { const prev = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = prev; }; }, []);
  const save = useMutation({
    mutationFn: () => saveFn({ data: {
      id: d.id ?? null, code: d.code, name: d.name.trim(), description: d.description.trim() || null, discount_type: d.discount_type, discount_value: Number(d.discount_value),
      cap_amount: d.cap_amount ? Number(d.cap_amount) : null, min_spend: d.min_spend ? Number(d.min_spend) : 0,
      max_uses_total: d.max_uses_total ? Number(d.max_uses_total) : null, max_uses_per_customer: d.max_uses_per_customer ? Number(d.max_uses_per_customer) : null,
      applies_to: d.applies_to, auto_apply: d.auto_apply, starts_at: d.starts_at ? new Date(d.starts_at).toISOString() : null, ends_at: d.ends_at ? new Date(d.ends_at).toISOString() : null,
      is_active: d.is_active, targets: d.applies_to === "all" ? [] : d.targets,
    } }),
    onSuccess: async () => { toast.success(isNew ? "Coupon created" : "Coupon updated"); await onSaved(); },
    onError: (e: Error) => setError(e.message),
  });
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((p) => ({ ...p, [key]: value }));
  const toggleTarget = (type: Target["target_type"], id: string) => setD((p) => ({ ...p, targets: p.targets.some((t) => t.target_type === type && t.target_id === id) ? p.targets.filter((t) => !(t.target_type === type && t.target_id === id)) : [...p.targets, { target_type: type, target_id: id }] }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!COUPON_CODE_RE.test(d.code)) return setError("Code must be 3-24 capital English letters or digits (A-Z, 0-9).");
    if (!d.name.trim()) return setError("Give the coupon an internal name.");
    if (!(Number(d.discount_value) > 0)) return setError("Discount value must be greater than 0.");
    if (d.discount_type === "percent" && Number(d.discount_value) > 100) return setError("Percentage discount cannot exceed 100%.");
    if (d.applies_to !== "all" && d.targets.length === 0) return setError("Select at least one target, or switch to “Everything”.");
    if (d.auto_apply && d.applies_to === "all") return setError("Automatic offers must target specific series or episodes.");
    if (d.auto_apply && Number(d.min_spend) > 0) return setError("Automatic offers cannot have a minimum spend.");
    if (d.starts_at && d.ends_at && new Date(d.starts_at) >= new Date(d.ends_at)) return setError("“Valid until” must be after “Valid from”.");
    save.mutate();
  }

  const seriesById = new Map(data.series.map((s) => [s.id, s]));
  const seriesItems = data.series.map((s) => ({ id: s.id, name: s.title, meta: s.price_bdt > 0 ? bdt(s.price_bdt) : "Free", image: mediaUrl(s.poster_url) }));
  const episodeItems = data.episodes.filter((e) => !e.is_free && e.price_bdt).map((e) => ({ id: e.id, name: `${seriesById.get(e.series_id)?.title ?? ""} · Ep ${e.episode_number}: ${e.title}`, meta: bdt(e.price_bdt ?? 0), image: mediaUrl(e.thumbnail_url) }));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="admin-theme fixed inset-0 z-[100] flex items-start justify-center overflow-hidden overscroll-contain bg-scrim p-3 backdrop-blur-sm sm:items-center">
      <form onSubmit={onSubmit} role="dialog" aria-modal="true" aria-label={isNew ? "New coupon" : "Edit coupon"} className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-5 py-3">
          <div className="flex items-center gap-2"><div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Ticket className="size-5" /></div><div><h2 className="text-base font-extrabold leading-tight">{isNew ? "New coupon" : editing ? "Edit coupon" : d.code}</h2><p className="text-[11px] text-muted-foreground">Series & episode coupon</p></div></div>
          <div className="flex items-center gap-2">{!editing ? <Button type="button" size="sm" variant="outline" onClick={() => setEditingMode(true)}><Pencil />Edit</Button> : null}<button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 transition-transform hover:bg-accent active:scale-90"><X className="size-5" /></button></div>
        </div>
        <fieldset disabled={!editing || save.isPending} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5">
          <Section title="Basics" icon={BadgePercent}>
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Code" required hint="Viewers type this — e.g. EID25"><input className={cn(inputClass, "font-mono uppercase tracking-wider")} value={d.code} onChange={(e) => update("code", maskCouponCode(e.target.value))} placeholder="EID25" autoCapitalize="characters" required /></FormField>
              <FormField label="Name" required hint="Shown internally in reports"><input className={inputClass} value={d.name} onChange={(e) => update("name", e.target.value)} placeholder="Eid offer" maxLength={120} required /></FormField>
              <FormField label="Description" className="md:col-span-2" hint="Optional internal note"><textarea className={cn(inputClass, "min-h-16 resize-y")} value={d.description} onChange={(e) => update("description", e.target.value)} maxLength={500} placeholder="e.g. Eid campaign for new viewers" /></FormField>
            </div>
          </Section>
          <Section title="Discount" icon={Percent}>
            <div className="grid gap-3 md:grid-cols-3">
              <FormField label="Type"><select className={inputClass} value={d.discount_type} onChange={(e) => update("discount_type", e.target.value as Draft["discount_type"])}><option value="percent">Percentage (%)</option><option value="flat">Flat amount (৳)</option></select></FormField>
              <FormField label={d.discount_type === "percent" ? "Percent off" : "Amount off (৳)"} required><input className={inputClass} type="number" min={1} max={d.discount_type === "percent" ? 100 : undefined} step="1" value={d.discount_value} onChange={(e) => update("discount_value", e.target.value)} required /></FormField>
              <FormField label="Max discount (৳)" hint={d.discount_type === "percent" ? "Optional cap" : "Only for percentage"}><input className={inputClass} type="number" min={1} value={d.cap_amount} onChange={(e) => update("cap_amount", e.target.value)} disabled={d.discount_type !== "percent"} placeholder="No cap" /></FormField>
              <FormField label="Minimum spend (৳)" hint={d.auto_apply ? "Not available for automatic offers" : "On eligible items"}><input className={inputClass} type="number" min={0} value={d.min_spend} onChange={(e) => update("min_spend", e.target.value)} disabled={d.auto_apply} /></FormField>
            </div>
          </Section>
          <Section title="Usage limits" icon={Users}>
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Total uses" hint="Leave empty for unlimited"><input className={inputClass} type="number" min={1} value={d.max_uses_total} onChange={(e) => update("max_uses_total", e.target.value)} placeholder="Unlimited" /></FormField>
              <FormField label="Uses per viewer" hint="Leave empty for unlimited"><input className={inputClass} type="number" min={1} value={d.max_uses_per_customer} onChange={(e) => update("max_uses_per_customer", e.target.value)} placeholder="Unlimited" /></FormField>
            </div>
          </Section>
          <Section title="Schedule" icon={CalendarDays}>
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Valid from"><input className={inputClass} type="datetime-local" value={d.starts_at} onChange={(e) => update("starts_at", e.target.value)} /></FormField>
              <FormField label="Valid until"><input className={inputClass} type="datetime-local" value={d.ends_at} onChange={(e) => update("ends_at", e.target.value)} /></FormField>
            </div>
          </Section>
          <Section title="Applies to" icon={Package}>
            <FormField label="Applicability"><select className={inputClass} value={d.applies_to} onChange={(e) => { const v = e.target.value as AppliesTo; setD((p) => ({ ...p, applies_to: v, targets: [], auto_apply: v === "all" ? false : p.auto_apply })); }}>
              <option value="all">Everything (code only)</option><option value="series">Specific series (and their episodes)</option><option value="episodes">Specific episodes</option>
            </select></FormField>
            {d.applies_to === "series" ? <div className="mt-3"><Picker label="Select series" items={seriesItems} selected={d.targets.filter((t) => t.target_type === "series").map((t) => t.target_id)} onToggle={(id) => toggleTarget("series", id)} /></div> : null}
            {d.applies_to === "episodes" ? <div className="mt-3">{episodeItems.length ? <Picker label="Select episodes" items={episodeItems} selected={d.targets.filter((t) => t.target_type === "episode").map((t) => t.target_id)} onToggle={(id) => toggleTarget("episode", id)} /> : <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">No episode has its own price yet. Set a single-episode price in the episode editor first.</p>}</div> : null}
          </Section>
          <div className="grid gap-2 rounded-2xl border border-border bg-muted/30 p-3 sm:grid-cols-2">
            <Checkbox label="Active" checked={d.is_active} onChange={(v) => update("is_active", v)} />
            <Checkbox label="Apply automatically in the cart" hint="Tagged items show the sale price everywhere" checked={d.auto_apply} disabled={d.applies_to === "all"} onChange={(v) => setD((p) => ({ ...p, auto_apply: v, min_spend: v ? "0" : p.min_spend }))} />
          </div>
          {error ? <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive">{error}</p> : null}
        </fieldset>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-background px-5 py-3">
          <Button type="button" variant="outline" onClick={() => (editing && !isNew ? (setD(draft), setEditingMode(false), setError(null)) : onClose())} className="active:scale-95">Cancel</Button>
          <Button type="submit" disabled={!editing || save.isPending || !changed && !isNew} className="gap-1.5 active:scale-[0.97]">{save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{isNew ? "Create coupon" : changed ? "Save changes" : "No changes"}</Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-border bg-card/40 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-bold"><Icon className="size-4 text-primary" /><span>{title}</span></div>{children}</section>;
}
function FormField({ label, hint, required, className, children }: { label: string; hint?: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return <label className={cn("block", className)}><span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}{required ? <span className="text-destructive"> *</span> : null}</span><div className="mt-1.5">{children}</div>{hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}</label>;
}
function Checkbox({ label, hint, checked, disabled, onChange }: { label: string; hint?: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return <label className={cn("flex cursor-pointer items-start gap-2 rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-accent/60", disabled && "cursor-not-allowed opacity-60")}><input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 rounded border-border accent-primary" /><span><span className="block font-semibold">{label}</span>{hint ? <span className="block text-[11px] text-muted-foreground">{hint}</span> : null}</span></label>;
}
function Picker({ label, items, selected, onToggle }: { label: string; items: { id: string; name: string; meta?: string; image: string | null }[]; selected: string[]; onToggle: (id: string) => void }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const set = new Set(selected);
  const ordered = (needle ? items.filter((i) => `${i.name} ${i.meta ?? ""}`.toLowerCase().includes(needle)) : items).sort((a, b) => Number(set.has(b.id)) - Number(set.has(a.id)));
  return <div>
    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground"><span>{label}</span><span>{selected.length} selected</span></div>
    <div className="rounded-2xl border border-border bg-background p-2">
      <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className={cn(inputClass, "pl-8")} /></div>
      <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
        {ordered.length === 0 ? <div className="p-4 text-center text-xs text-muted-foreground">Nothing found</div> : null}
        {ordered.map((i) => { const on = set.has(i.id); return <button key={i.id} type="button" onClick={() => onToggle(i.id)} className={cn("flex w-full items-center gap-2 rounded-xl p-1.5 text-left transition-all duration-150 active:scale-[0.99]", on ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-accent")}>
          {i.image ? <img src={i.image} alt="" className="size-9 rounded-lg object-cover" /> : <div className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"><Film className="size-4" /></div>}
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{i.name}</p>{i.meta ? <p className="truncate text-[11px] text-muted-foreground">{i.meta}</p> : null}</div>
          <span className={cn("grid size-5 shrink-0 place-items-center rounded border", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background")}>{on ? <Check className="size-3.5" /> : null}</span>
        </button>; })}
      </div>
    </div>
  </div>;
}
