import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Receipt } from "lucide-react";
import { PageHeader, Panel, Chip } from "@/components/dashboard/DashboardKit";
import { listMyOrders } from "@/lib/commerce.functions";
import { formatTaka } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/orders")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Orders & payments — Branta Films" }, { name: "description", content: "Your Branta Films purchases and payment status." },
    { property: "og:title", content: "Orders & payments — Branta Films" }, { property: "og:description", content: "Your purchases and payment status." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: OrdersPage,
});

const STATUS = { pending: { label: "Awaiting verification", tone: "brand" }, approved: { label: "Unlocked", tone: "success" }, rejected: { label: "Rejected", tone: "neutral" } } as const;

function OrdersPage() {
  const fn = useServerFn(listMyOrders);
  const { data, isPending } = useQuery({ queryKey: ["my-orders"], queryFn: () => fn(), refetchInterval: 30_000 });
  return <>
    <PageHeader icon={Receipt} eyebrow="Payments" title="Orders & payments" description="Every payment you've submitted and its verification status." />
    <Panel delay={80}>
      {isPending ? <div className="h-32 animate-pulse rounded-md bg-muted" /> : !data?.length ? <p className="py-10 text-center text-muted-foreground">No orders yet.</p> :
        <ul className="divide-y divide-border">{data.map((o) => { const s = STATUS[o.status as keyof typeof STATUS]; return <li key={o.id} className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold tabular-nums">{formatTaka(o.total_bdt)} <span className="ml-1 text-xs font-normal uppercase text-muted-foreground">{o.method} · {o.trx_id}</span></p><p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p></div><Chip tone={s.tone}>{s.label}</Chip></div>
          <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">{o.order_items.map((i) => <li key={i.item_id} className="flex justify-between gap-3"><span className="truncate">{i.title}</span><span className="shrink-0 tabular-nums">{formatTaka(i.final_price_bdt)}</span></li>)}</ul>
          {o.discount_bdt ? <p className="mt-1 text-xs text-success">Coupon {o.coupon_code} saved {formatTaka(o.discount_bdt)}</p> : null}
          {o.status === "rejected" && o.reject_reason ? <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">Reason: {o.reject_reason}</p> : null}
        </li>; })}</ul>}
    </Panel>
  </>;
}
