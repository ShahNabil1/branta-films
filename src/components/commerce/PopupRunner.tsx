import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, X } from "lucide-react";
import { listActivePopups, type PublicPopup } from "@/lib/popups.functions";
import { popupArea, popupSeenKey, popupShowsIn } from "@/lib/popup-schedule";
import { useCart } from "@/lib/cart";
import { mediaUrl } from "@/lib/media";

function seen(p: PublicPopup) {
  try {
    if (p.frequency === "once") return localStorage.getItem(popupSeenKey(p)) === "1";
    if (p.frequency === "session") return sessionStorage.getItem(popupSeenKey(p)) === "1";
  } catch { /* private mode */ }
  return false;
}
function markSeen(p: PublicPopup) {
  try {
    if (p.frequency === "once") localStorage.setItem(popupSeenKey(p), "1");
    if (p.frequency === "session") sessionStorage.setItem(popupSeenKey(p), "1");
  } catch { /* ignore */ }
}

/**
 * Shows admin-scheduled image popups: each after its own delay from entering
 * the site or dashboard, one at a time, closed only with [X] (or by acting on it).
 */
export function PopupRunner() {
  const { pathname } = useLocation();
  const area = popupArea(pathname);
  const { data: popups = [] } = useQuery({ queryKey: ["popups"], queryFn: () => listActivePopups(), staleTime: 5 * 60_000 });
  const [queue, setQueue] = useState<PublicPopup[]>([]);
  const shownThisVisit = useRef(new Set<string>());
  const cart = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!area) return;
    const timers = popups.filter((p) => popupShowsIn(p.placement, area) && !seen(p) && !shownThisVisit.current.has(`${area}:${p.id}`)).map((p) =>
      window.setTimeout(() => {
        shownThisVisit.current.add(`${area}:${p.id}`);
        markSeen(p);
        setQueue((q) => (q.some((x) => x.id === p.id) ? q : [...q, p]));
      }, p.delay_seconds * 1000));
    return () => timers.forEach(clearTimeout);
  }, [area, popups]);

  // Leaving the area drops popups that belong only to it.
  useEffect(() => { setQueue((q) => q.filter((p) => popupShowsIn(p.placement, area))); }, [area]);

  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, [current]);
  if (!current) return null;

  const close = () => setQueue((q) => q.slice(1));
  const act = () => {
    const a = current.action;
    if (a.kind === "none") return;
    close();
    if (a.kind === "url") {
      if (a.url.startsWith("/")) void navigate({ to: a.url });
      else window.open(a.url, "_blank", "noopener,noreferrer");
    } else cart.add(a.item);
  };
  const clickable = current.action.kind !== "none";

  return (
    <div role="dialog" aria-modal="true" aria-label={current.alt} className="fixed inset-0 z-[60] grid place-items-center bg-scrim p-4 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-[min(92vw,560px)] animate-in zoom-in-95 duration-300">
        <button type="button" aria-label="Close" onClick={close} className="absolute -right-2 -top-2 z-10 grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95 sm:-right-3 sm:-top-3"><X className="size-5" /></button>
        {clickable ? <button type="button" onClick={act} className="block w-full cursor-pointer overflow-hidden rounded-2xl ring-1 ring-border transition-transform active:scale-[0.99]">
          <img src={mediaUrl(current.image) ?? undefined} alt={current.alt} className="block max-h-[80svh] w-full object-contain" />
        </button> : <img src={mediaUrl(current.image) ?? undefined} alt={current.alt} className="block max-h-[80svh] w-full rounded-2xl object-contain ring-1 ring-border" />}
        {current.action.kind === "cart" ? <button type="button" onClick={act} className="mx-auto mt-3 flex h-11 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95"><ShoppingCart className="size-4" />Purchase now</button> : null}
      </div>
    </div>
  );
}
