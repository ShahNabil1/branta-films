import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Pencil, Receipt, Search, X } from "lucide-react";
import { PageHeader, Panel, Chip, Field } from "@/components/admin/AdminKit";
import { BrandedDialog, ConfirmDialog } from "@/components/ui/branded-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listAdminOrders, reviewAdminOrder, saveAdminPaymentSettings } from "@/lib/commerce-admin.functions";
import { isDirty } from "@/lib/dirty";
import { formatTaka } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [
    { title: "Payments — Branta Films Admin" }, { name: "description", content: "Verify bKash, Nagad and Rocket payments." },
    { property: "og:title", content: "Payments — Branta Films Admin" }, { property: "og:description", content: "Branta Films administrator workspace." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: OrdersAdmin,
});

function OrdersAdmin() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAdminOrders);
  const reviewFn = useServerFn(reviewAdminOrder);
  const { data, isPending } = useQuery({ queryKey: ["admin", "orders"], queryFn: () => listFn(), refetchInterval: 20_000 });
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [q, setQ] = useState("");
  const [approve, setApprove] = useState<string | null>(null);
  const [reject, setReject] = useState<{ id: string; reason: string } | null>(null);
  const review = useMutation({
    mutationFn: (v: { id: string; approve: boolean; reason?: string }) => reviewFn({ data: v }),
    onSuccess: async (_d, v) => { toast.success(v.approve ? "Approved — access unlocked" : "Payment rejected"); setApprove(null); setReject(null); await qc.invalidateQueries({ queryKey: ["admin", "orders"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const orders = (data?.orders ?? []).filter((o) => o.status === tab && (!q || `${o.trx_id} ${o.sender_phone} ${o.profile?.email ?? ""} ${o.profile?.full_name ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  const count = (s: string) => (data?.orders ?? []).filter((o) => o.status === s).length;

  return <div className="space-y-5">
    <PageHeader title="Payments" description="Match each Transaction ID with your bKash/Nagad/Rocket statement, then approve to unlock." />
    {data ? <PaymentNumbers settings={data.settings} /> : null}
    <Panel className="flex flex-wrap items-center gap-2">
      {(["pending", "approved", "rejected"] as const).map((k) => <button key={k} type="button" onClick={() => setTab(k)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all active:scale-95", tab === k ? "border-primary/40 bg-primary/10 text-primary" : "border-border hover:bg-accent")}>{k} ({count(k)})</button>)}
      <div className="relative ml-auto min-w-[220px] flex-1 sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="rounded-xl pl-9" placeholder="TrxID, phone or email…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    </Panel>
    <Panel>
      {isPending ? <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" /> : orders.length === 0 ? <div className="py-10 text-center"><Receipt className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">No {tab} payments</p></div> :
        <ul className="space-y-3">{orders.map((o) => <li key={o.id} className="rounded-xl border border-border bg-background/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="font-semibold">{o.profile?.full_name || "Viewer"} <span className="text-xs font-normal text-muted-foreground">{o.profile?.email}</span></p><p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p></div>
            <div className="text-right"><p className="text-lg font-bold tabular-nums">{formatTaka(o.total_bdt)}</p>{o.discount_bdt ? <p className="text-xs text-success">−{formatTaka(o.discount_bdt)} · {o.coupon_code}</p> : null}</div>
          </div>
          <div className="mt-3 grid gap-2 rounded-lg bg-muted/40 p-3 text-sm sm:grid-cols-3"><div><span className="text-xs text-muted-foreground">Method</span><p className="font-semibold uppercase">{o.method}</p></div><div><span className="text-xs text-muted-foreground">Sender</span><p className="font-mono">{o.sender_phone}</p></div><div><span className="text-xs text-muted-foreground">Transaction ID</span><p className="font-mono font-bold tracking-wider">{o.trx_id}</p></div></div>
          <ul className="mt-3 space-y-1 text-sm">{o.order_items.map((i) => <li key={i.item_id} className="flex justify-between gap-3"><span className="truncate"><Chip>{i.item_type}</Chip> {i.title}</span><span className="shrink-0 tabular-nums">{formatTaka(i.final_price_bdt)}{i.discount_bdt ? <s className="ml-1 text-xs text-muted-foreground">{formatTaka(i.unit_price_bdt)}</s> : null}</span></li>)}</ul>
          {o.reject_reason ? <p className="mt-2 text-sm text-destructive">Reason: {o.reject_reason}</p> : null}
          {o.status === "pending" ? <div className="mt-3 flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setReject({ id: o.id, reason: "" })}><X />Reject</Button><Button size="sm" onClick={() => setApprove(o.id)}><Check />Approve & unlock</Button></div> : null}
        </li>)}</ul>}
    </Panel>
    <ConfirmDialog open={Boolean(approve)} onClose={() => setApprove(null)} title="Approve this payment?" description="Confirm you received this exact amount with this Transaction ID. The viewer gets access immediately." confirmLabel="Approve" busy={review.isPending} onConfirm={() => approve && review.mutate({ id: approve, approve: true })} />
    <BrandedDialog open={Boolean(reject)} onClose={() => setReject(null)} title="Reject payment" description="The viewer will see this reason in their orders.">
      <div className="admin-theme space-y-3"><Input autoFocus placeholder="e.g. Transaction ID not found" value={reject?.reason ?? ""} onChange={(e) => setReject((r) => (r ? { ...r, reason: e.target.value } : r))} maxLength={300} />
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setReject(null)}>Cancel</Button><Button variant="destructive" disabled={!reject?.reason.trim() || review.isPending} onClick={() => reject && review.mutate({ id: reject.id, approve: false, reason: reject.reason.trim() })}>Reject</Button></div></div>
    </BrandedDialog>
  </div>;
}

type Settings = { bkash: string; nagad: string; rocket: string; instructions: string } | null;
function PaymentNumbers({ settings }: { settings: Settings }) {
  const qc = useQueryClient();
  const saveFn = useServerFn(saveAdminPaymentSettings);
  const initial = { bkash: settings?.bkash ?? "", nagad: settings?.nagad ?? "", rocket: settings?.rocket ?? "", instructions: settings?.instructions ?? "" };
  const [v, setV] = useState(initial);
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (!editing) setV(initial); }, [settings]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useMutation({ mutationFn: () => saveFn({ data: v }), onSuccess: async () => { toast.success("Payment numbers saved"); setEditing(false); await qc.invalidateQueries({ queryKey: ["admin", "orders"] }); }, onError: (e: Error) => toast.error(e.message) });
  return <Panel title="Receiving numbers" description="Viewers send money to these. Leave a method empty to hide it." action={editing ? null : <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil />Edit</Button>}>
    <fieldset disabled={!editing || save.isPending} className="grid gap-4 sm:grid-cols-3">
      {(["bkash", "nagad", "rocket"] as const).map((k) => <Field key={k} label={k}><Input className="admin-input font-mono" inputMode="tel" placeholder="01XXXXXXXXX" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d]/g, "").slice(0, 14) })} /></Field>)}
      <Field label="Instructions" className="sm:col-span-3"><Input className="admin-input" value={v.instructions} maxLength={500} onChange={(e) => setV({ ...v, instructions: e.target.value })} /></Field>
    </fieldset>
    {editing ? <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => { setV(initial); setEditing(false); }}>Cancel</Button><Button disabled={!isDirty(v, initial) || save.isPending} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="animate-spin" /> : null}Save</Button></div> : null}
  </Panel>;
}
