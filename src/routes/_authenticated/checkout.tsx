import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Film, Loader2, ShieldCheck, Ticket, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart";
import { getPaymentNumbers, placeOrder, quoteMyCart } from "@/lib/commerce.functions";
import { BD_PHONE_RE, TRX_ID_RE, maskCouponCode } from "@/lib/cart-pricing";
import { formatTaka } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { BdPhoneInput } from "@/components/forms/BdPhoneInput";
import bkashLogo from "@/assets/bkash-logo.asset.json";
import nagadLogo from "@/assets/nagad-logo.asset.json";

export const Route = createFileRoute("/_authenticated/checkout")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Checkout — Branta Films" }, { name: "description", content: "Pay for your Branta Films series and episodes with bKash, Nagad or Rocket." },
    { property: "og:title", content: "Checkout — Branta Films" }, { property: "og:description", content: "Secure manual mobile payment checkout." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: CheckoutPage,
});

const METHODS = [
  { id: "bkash", label: "bKash", logo: bkashLogo.url },
  { id: "nagad", label: "Nagad", logo: nagadLogo.url },
] as const;

function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const quoteFn = useServerFn(quoteMyCart);
  const placeFn = useServerFn(placeOrder);
  const numbersFn = useServerFn(getPaymentNumbers);
  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [method, setMethod] = useState<"bkash" | "nagad">("bkash");
  const [phone, setPhone] = useState("");
  const [trx, setTrx] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);
  const announcedCode = useRef<string | null>(null);
  const request = cart.items.map((i) => ({ type: i.type, id: i.id }));
  const quote = useQuery({ queryKey: ["checkout-quote", request, code], enabled: request.length > 0, queryFn: () => quoteFn({ data: { items: request, code } }) });
  const numbers = useQuery({ queryKey: ["payment-numbers"], queryFn: () => numbersFn() });
  const q = quote.data;

  // Items that can no longer be bought (owned, pending, withdrawn) leave the cart.
  useEffect(() => {
    if (!q?.problems.length) return;
    q.problems.forEach((p) => { cart.remove(p.type, p.id); toast.info(p.reason); });
  }, [q?.problems]); // eslint-disable-line react-hooks/exhaustive-deps

  // One verdict toast per applied coupon: red when rejected, green when it saved money.
  useEffect(() => {
    if (!code) { announcedCode.current = null; return; }
    if (quote.isFetching) return;
    if (quote.isError) { toast.error("Could not check that coupon — please try again."); return; }
    if (!q) return;
    if (q.manualError) {
      toast.error("Invalid coupon", { description: q.manualError, className: "border-destructive/40" });
      setCode(null); setCodeInput("");
      return;
    }
    if (q.manualCode === code && q.discount > 0 && announcedCode.current !== code) {
      announcedCode.current = code;
      toast.success(`${q.manualCode} applied`, { description: `You saved ${formatTaka(q.discount)} on this order.`, className: "border-success/40" });
    }
  }, [code, quote.isFetching, quote.isError, q]);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  function copyMerchant() {
    void navigator.clipboard.writeText(merchant);
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 2200);
  }

  const available = METHODS.filter((m) => numbers.data?.[m.id]);
  useEffect(() => { if (available.length && !available.some((m) => m.id === method)) setMethod(available[0]!.id); }, [available, method]);
  const merchant = numbers.data?.[method] ?? "";
  const cleanPhone = phone;
  const phoneOk = BD_PHONE_RE.test(cleanPhone);
  const trxOk = TRX_ID_RE.test(trx);
  const canPay = Boolean(q && q.lines.length && q.total > 0 && phoneOk && trxOk && merchant && !quote.isFetching && !submitting);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q || !canPay) return;
    setSubmitting(true);
    try {
      await placeFn({ data: { items: request, code: q.manualCode, method, sender_phone: cleanPhone, trx_id: trx, expected_total: q.total } });
      cart.clear();
      await qc.invalidateQueries({ queryKey: ["ownership"] });
      toast.success("Payment submitted — we'll unlock it as soon as it's verified.");
      void navigate({ to: "/account/orders" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit payment");
      void quote.refetch();
    } finally { setSubmitting(false); }
  }

  if (!cart.items.length) return <SiteShell><div className="mx-auto max-w-lg px-5 py-24 text-center"><h1 className="text-h2 font-semibold">Your cart is empty</h1><p className="mt-3 text-muted-foreground">Add a series or a few episodes, then come back here to pay.</p><Button asChild className="mt-6"><Link to="/browse">Browse series</Link></Button></div></SiteShell>;

  return (
    <SiteShell>
      <form onSubmit={submit} className="mx-auto grid max-w-[1200px] gap-8 px-[clamp(1.25rem,4vw,3rem)] py-12 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <h1 className="text-h2 font-semibold">Checkout<span className="text-primary">.</span></h1>
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-semibold">1. Choose how you pay</h2>
            {numbers.isPending ? <Loader2 className="mt-4 size-5 animate-spin text-muted-foreground" /> : available.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Payments are not open yet. Please check back soon.</p> : <>
              <div className="mt-4 grid grid-cols-2 gap-3">{available.map((m) => <button key={m.id} type="button" onClick={() => setMethod(m.id)} aria-pressed={method === m.id} className={cn("relative flex h-20 items-center justify-center gap-3 rounded-xl border-2 font-semibold transition-all active:scale-95", method === m.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40")}><span className="grid size-12 place-items-center overflow-hidden rounded-xl bg-white p-1"><img src={m.logo} alt="" className="size-full object-contain" /></span><span className="text-base">{m.label}</span>{method === m.id ? <Check className="absolute right-2 top-2 size-4 text-primary" /> : null}</button>)}</div>
              <div className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm">
                <ol className="list-decimal space-y-1 pl-5 text-muted-foreground"><li>Open your {METHODS.find((m) => m.id === method)?.label} app and choose <b className="text-foreground">Send Money</b>.</li><li>Send the exact amount below to the number shown.</li><li>Copy the Transaction ID from the confirmation SMS and enter it below.</li></ol>{numbers.data?.instructions ? <p className="mt-2 text-muted-foreground">{numbers.data.instructions}</p> : null}
                <div className="mt-3 flex items-center justify-between gap-3"><div><p className="text-xs text-muted-foreground">Send Money to ({METHODS.find((m) => m.id === method)?.label} Personal)</p><p className="font-mono text-xl font-bold tracking-wider">{merchant}</p></div>
                  <Button type="button" variant="outline" size="sm" aria-live="polite" onClick={copyMerchant} className={cn("gap-1.5 transition-all duration-300 active:scale-95", copied && "border-success/50 bg-success/10 text-success hover:bg-success/15 hover:text-success")}>{copied ? <Check className="size-4 animate-in zoom-in-50 duration-300" /> : <Copy className="size-4" />}<span className={cn(copied && "animate-in fade-in slide-in-from-left-1 duration-300")}>{copied ? "Copied" : "Copy"}</span></Button></div>
                {q ? <p className="mt-3">Amount: <span className="font-bold tabular-nums">{formatTaka(q.total)}</span></p> : null}
              </div>
            </>}
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-semibold">2. Confirm your payment</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5"><span className="text-sm font-medium">Number you paid from</span><BdPhoneInput value={phone} onChange={setPhone} invalid={phone !== "" && !phoneOk} />{phone && !phoneOk ? <span className="text-xs text-destructive">Enter 11 digits starting with 013–019.</span> : null}</label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Transaction ID</span><Input className="font-mono uppercase tracking-wider" placeholder="e.g. 9ACD7XK2LM" value={trx} onChange={(e) => setTrx(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20))} inputMode="text" autoCapitalize="characters" spellCheck={false} aria-invalid={trx !== "" && !trxOk} />{trx && !trxOk ? <span className="text-xs text-destructive">6–20 letters or digits, exactly as in your SMS.</span> : null}</label>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />Our team checks every payment. Your series or episodes unlock automatically once it's confirmed — usually within minutes.</p>
          </section>
        </div>
        <aside className="h-fit space-y-4 rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold">Order summary</h2>
          <ul className="space-y-3">{cart.items.map((i) => { const line = q?.lines.find((l) => l.type === i.type && l.id === i.id); const src = mediaUrl(i.image); return <li key={`${i.type}:${i.id}`} className="flex gap-3">
            {src ? <img src={src} alt="" className="h-12 w-20 shrink-0 rounded-md object-cover" /> : <span className="grid h-12 w-20 shrink-0 place-items-center rounded-md bg-muted"><Film className="size-4" /></span>}
            <div className="min-w-0 flex-1 text-sm"><p className="line-clamp-2">{i.title}</p><p className="tabular-nums"><span className="font-semibold">{formatTaka(line?.final ?? i.price)}</span>{line?.discount ? <s className="ml-1.5 text-xs text-muted-foreground">{formatTaka(line.price)}</s> : null}</p></div>
            <button type="button" aria-label={`Remove ${i.title}`} onClick={() => cart.remove(i.type, i.id)} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 className="size-4" /></button>
          </li>; })}</ul>
          <div>
            {code && q?.manualCode ? <div className="flex items-center justify-between rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm text-success"><span className="inline-flex items-center gap-1.5 font-semibold"><Check className="size-4" />{q.manualCode} applied</span><button type="button" aria-label="Remove coupon" onClick={() => { setCode(null); setCodeInput(""); }}><X className="size-4" /></button></div>
              : <div className="flex gap-2"><Input aria-label="Coupon code" placeholder="Coupon code" className="font-mono uppercase" value={codeInput} onChange={(e) => setCodeInput(maskCouponCode(e.target.value))} /><Button type="button" variant="outline" disabled={codeInput.length < 3 || quote.isFetching} onClick={() => setCode(codeInput)}>Apply</Button></div>}
          </div>
          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{q ? formatTaka(q.subtotal) : "…"}</span></div>
            {q?.discount ? <div className="flex justify-between text-success"><span className="inline-flex items-center gap-1.5"><Ticket className="size-3.5" />Coupon applied · {q.appliedLabel}</span><span className="tabular-nums">−{formatTaka(q.discount)}</span></div> : null}
            <div className="flex justify-between text-base font-bold"><span>Total</span><span className="tabular-nums">{q ? formatTaka(q.total) : "…"}</span></div>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={!canPay}>{submitting ? <Loader2 className="animate-spin" /> : <ShieldCheck />}Submit payment</Button>
        </aside>
      </form>
    </SiteShell>
  );
}
