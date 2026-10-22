import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { Film, ShoppingCart, Ticket, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { mediaUrl } from "@/lib/media";
import { formatTaka } from "@/lib/format";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** Cart drawer. Like every modal here it closes only via [X] or an action. */
export function CartSheet() {
  const { open, setOpen, quote, remove, items } = useCart();
  const image = (type: string, id: string) => items.find((i) => i.type === type && i.id === id)?.image ?? null;
  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-popover shadow-[var(--shadow-card)] data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <DialogPrimitive.Title className="text-h4 flex items-center gap-2 font-semibold"><ShoppingCart className="size-5 text-primary" />Your cart</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Series and episodes ready to buy</DialogPrimitive.Description>
            <Button variant="ghost" size="icon" aria-label="Close cart" onClick={() => setOpen(false)} className="rounded-full"><X className="size-4" /></Button>
          </div>
          {quote.lines.length === 0 ? <div className="grid flex-1 place-items-center p-8 text-center"><div><ShoppingCart className="mx-auto size-10 text-muted-foreground" /><p className="mt-4 font-semibold">Your cart is empty</p><p className="mt-1 text-sm text-muted-foreground">Tap a locked episode to add it.</p><Button asChild variant="outline" className="mt-5" onClick={() => setOpen(false)}><Link to="/browse">Browse series</Link></Button></div></div> : <>
            <ul className="flex-1 space-y-3 overflow-y-auto p-5">
              {quote.lines.map((l) => { const src = mediaUrl(image(l.type, l.id)); return <li key={`${l.type}:${l.id}`} className="flex gap-3 rounded-xl border border-border bg-surface p-2.5">
                {src ? <img src={src} alt="" className="h-14 w-24 shrink-0 rounded-md object-cover" /> : <span className="grid h-14 w-24 shrink-0 place-items-center rounded-md bg-muted"><Film className="size-4 text-muted-foreground" /></span>}
                <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-medium">{l.title}</p><p className="mt-1 text-sm tabular-nums"><span className="font-bold">{formatTaka(l.final)}</span>{l.discount ? <s className="ml-1.5 text-xs text-muted-foreground">{formatTaka(l.price)}</s> : null}</p></div>
                <Button variant="ghost" size="icon" aria-label={`Remove ${l.title}`} onClick={() => remove(l.type, l.id)} className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></Button>
              </li>; })}
            </ul>
            <div className="space-y-2 border-t border-border p-5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatTaka(quote.subtotal)}</span></div>
              {quote.discount ? <div className="flex justify-between text-success"><span className="inline-flex items-center gap-1.5"><Ticket className="size-3.5" />Coupon applied · {quote.appliedLabel}</span><span className="tabular-nums">−{formatTaka(quote.discount)}</span></div> : null}
              <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span className="tabular-nums">{formatTaka(quote.total)}</span></div>
              <Button asChild size="lg" className="mt-3 w-full" onClick={() => setOpen(false)}><Link to="/checkout">Checkout</Link></Button>
            </div>
          </>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function CartButton() {
  const { items, setOpen } = useCart();
  return <TooltipProvider delayDuration={250}><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={`Cart, ${items.length} items`} onClick={() => setOpen(true)} className="header-utility nav-cart relative size-11">
    <ShoppingCart className="size-[18px]" />
    {items.length ? <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">{items.length}</span> : null}
  </Button></TooltipTrigger><TooltipContent side="bottom" className="border border-border bg-popover text-popover-foreground">Cart</TooltipContent></Tooltip></TooltipProvider>;
}
