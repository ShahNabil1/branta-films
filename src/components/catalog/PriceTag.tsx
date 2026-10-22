import { formatTaka } from "@/lib/format";
import { seriesPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** Price with the regular price struck through and a "% off" badge when discounted. */
export function PriceTag({ price, discount, className, badge = true }: { price: number; discount?: number | null; className?: string; badge?: boolean }) {
  const p = seriesPrice(price, discount);
  return <span className={cn("inline-flex items-baseline gap-1.5 tabular-nums", className)}>
    <span className="font-semibold text-foreground">{formatTaka(p.final)}</span>
    {p.original != null ? <>
      <s className="text-[0.85em] text-muted-foreground decoration-1">{formatTaka(p.original)}</s>
      {badge && p.percentOff > 0 ? <span className="self-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">−{p.percentOff}%</span> : null}
    </> : null}
  </span>;
}
