import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { listOffers } from "./commerce.functions";
import { normaliseCart, quoteCart, type CartItemType, type CartQuote } from "./cart-pricing";

export type CartEntry = { type: CartItemType; id: string; seriesId: string | null; title: string; price: number; image: string | null };

type CartState = {
  items: CartEntry[];
  quote: CartQuote;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (items: CartEntry | CartEntry[], opts?: { open?: boolean }) => void;
  remove: (type: CartItemType, id: string) => void;
  clear: () => void;
  has: (type: CartItemType, id: string) => boolean;
};

const KEY = "branta_cart_v1";
const Ctx = createContext<CartState | null>(null);
export const offersQuery = { queryKey: ["offers"], queryFn: () => listOffers(), staleTime: 60_000 } as const;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartEntry[]>([]);
  const [open, setOpen] = useState(false);
  const { data: offers = [] } = useQuery(offersQuery);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setItems(normaliseCart(JSON.parse(raw) as CartEntry[]).slice(0, 50)); } catch { /* ignore */ }
  }, []);
  const persist = useCallback((next: CartEntry[]) => { setItems(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ } }, []);

  const add = useCallback((incoming: CartEntry | CartEntry[], opts?: { open?: boolean }) => {
    const list = Array.isArray(incoming) ? incoming : [incoming];
    setItems((prev) => {
      const coveredBySeries = list.filter((i) => i.type === "episode" && prev.some((p) => p.type === "series" && p.id === i.seriesId));
      if (coveredBySeries.length) toast.info("The full series in your cart already includes this episode.");
      const replaced = list.some((i) => i.type === "series") && prev.some((p) => p.type === "episode" && list.some((i) => i.type === "series" && i.id === p.seriesId));
      if (replaced) toast.info("Single episodes were replaced by the full series.");
      const next = normaliseCart([...prev, ...list]).slice(0, 50);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    if (opts?.open !== false) setOpen(true);
  }, []);

  const value = useMemo<CartState>(() => ({
    items, open, setOpen, add,
    quote: quoteCart(items, offers, null),
    remove: (type, id) => persist(items.filter((i) => !(i.type === type && i.id === id))),
    clear: () => persist([]),
    has: (type, id) => items.some((i) => i.type === type && i.id === id),
  }), [items, open, add, offers, persist]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}
