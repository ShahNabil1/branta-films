import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Layers, ShoppingCart, Sparkles, Ticket, Zap } from "lucide-react";
import { BrandedDialog } from "@/components/ui/branded-dialog";
import { Button } from "@/components/ui/button";
import { useCart, type CartEntry } from "@/lib/cart";
import { quoteCart } from "@/lib/cart-pricing";
import { useQuery } from "@tanstack/react-query";
import { offersQuery } from "@/lib/cart";
import { formatTaka } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PurchasableEpisode = { id: string; episode_number: number; title: string; price_bdt: number | null; image: string | null };
export type PurchaseSeries = { id: string; title: string; price_bdt: number; image: string | null };

/**
 * In-context purchase: tapping a locked episode offers that episode, the full
 * series, or several episodes at once — then Add to cart or Buy now.
 */
export function PurchaseDialog({ open, onClose, series, episodes, focusEpisodeId }: {
  open: boolean; onClose: () => void; series: PurchaseSeries;
  /** Locked episodes the viewer can still buy individually. */
  episodes: PurchasableEpisode[];
  focusEpisodeId: string | null;
}) {
  const cart = useCart();
  const navigate = useNavigate();
  const { data: offers = [] } = useQuery(offersQuery);
  const sellable = episodes.filter((e) => e.price_bdt && e.price_bdt > 0);
  const focus = sellable.find((e) => e.id === focusEpisodeId) ?? null;
  const [mode, setMode] = useState<"episode" | "series" | "multi">("series");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!open) return;
    setMode(focus ? "episode" : series.price_bdt > 0 ? "series" : "multi");
    setPicked(new Set(focus ? [focus.id] : []));
  }, [open, focus, series.price_bdt]);

  const toEntry = (e: PurchasableEpisode): CartEntry => ({ type: "episode", id: e.id, seriesId: series.id, title: `${series.title} · Ep ${e.episode_number}: ${e.title}`, price: e.price_bdt ?? 0, image: e.image });
  const seriesEntry: CartEntry = { type: "series", id: series.id, seriesId: null, title: `${series.title} — full series`, price: series.price_bdt, image: series.image };
  const selection: CartEntry[] = mode === "series" ? [seriesEntry] : mode === "episode" && focus ? [toEntry(focus)] : sellable.filter((e) => picked.has(e.id)).map(toEntry);
  const q = quoteCart(selection, offers, null);
  const seriesQ = quoteCart([seriesEntry], offers, null);
  const allEpisodes = sellable.reduce((s, e) => s + (e.price_bdt ?? 0), 0);
  const save = allEpisodes > seriesQ.total ? allEpisodes - seriesQ.total : 0;

  const go = (checkout: boolean) => {
    if (!selection.length) return;
    cart.add(selection, { open: !checkout });
    onClose();
    if (checkout) void navigate({ to: "/checkout" });
  };

  const Option = ({ value, icon: Icon, title, sub, price, badge }: { value: typeof mode; icon: typeof Zap; title: string; sub: string; price?: { final: number; original: number | null }; badge?: string }) => (
    <button type="button" onClick={() => setMode(value)} aria-pressed={mode === value}
      className={cn("relative flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-200 active:scale-[0.99]", mode === value ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--color-primary)]" : "border-border hover:border-primary/40 hover:bg-secondary")}>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", mode === value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}><Icon className="size-4" /></span>
      <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="block text-xs text-muted-foreground">{sub}</span></span>
      {price ? <span className="shrink-0 text-right tabular-nums"><span className="block font-bold">{formatTaka(price.final)}</span>{price.original != null ? <s className="text-xs text-muted-foreground">{formatTaka(price.original)}</s> : null}</span> : null}
      {badge ? <span className="absolute -top-2 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{badge}</span> : null}
    </button>
  );
  const priceOf = (items: CartEntry[]) => { const r = quoteCart(items, offers, null); return { final: r.total, original: r.discount ? r.subtotal : null }; };

  return (
    <BrandedDialog open={open} onClose={onClose} title={focus ? `Unlock episode ${focus.episode_number}` : `Unlock ${series.title}`} description="Pay with bKash, Nagad or Rocket. Access opens as soon as your payment is verified." className="max-w-lg">
      <div className="space-y-2.5">
        {focus ? <Option value="episode" icon={Zap} title={`Only episode ${focus.episode_number}`} sub={focus.title} price={priceOf([toEntry(focus)])} /> : null}
        {series.price_bdt > 0 ? <Option value="series" icon={Sparkles} title="Full series" sub="Every episode, now and future" price={priceOf([seriesEntry])} badge={save > 0 ? `Save ${formatTaka(save)}` : "Best value"} /> : null}
        {sellable.length > 1 ? <Option value="multi" icon={Layers} title="Choose episodes" sub="Pick several and pay once" /> : null}
        {mode === "multi" ? <ul className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border p-1.5">
          {sellable.map((e) => { const on = picked.has(e.id); const p = priceOf([toEntry(e)]); return <li key={e.id}><button type="button" aria-pressed={on} onClick={() => setPicked((prev) => { const n = new Set(prev); if (n.has(e.id)) n.delete(e.id); else n.add(e.id); return n; })} className={cn("flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm transition-colors", on ? "bg-primary/10" : "hover:bg-secondary")}>
            <span className={cn("grid size-5 shrink-0 place-items-center rounded border", on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{on ? <Check className="size-3.5" /> : null}</span>
            <span className="min-w-0 flex-1 truncate"><span className="mr-1.5 tabular-nums text-muted-foreground">{String(e.episode_number).padStart(2, "0")}</span>{e.title}</span>
            <span className="shrink-0 tabular-nums">{formatTaka(p.final)}{p.original != null ? <s className="ml-1 text-xs text-muted-foreground">{formatTaka(p.original)}</s> : null}</span>
          </button></li>; })}
        </ul> : null}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3 text-sm">
        <span className="text-muted-foreground">{selection.length} item{selection.length === 1 ? "" : "s"}{q.appliedLabel ? <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success"><Ticket className="size-3" />{q.appliedLabel}</span> : null}</span>
        <span className="text-lg font-bold tabular-nums">{formatTaka(q.total)}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" disabled={!selection.length} onClick={() => go(false)}><ShoppingCart />Add to cart</Button>
        <Button disabled={!selection.length} onClick={() => go(true)}><Zap />Buy now</Button>
      </div>
    </BrandedDialog>
  );
}
