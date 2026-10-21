import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/layout/primitives";

type Props = {
  title: string;
  eyebrow?: string;
  seeAll?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Horizontal, snap-scrolling row. Arrow buttons appear on hover (desktop); touch users swipe.
 * Vertical padding inside the scroller leaves room for card hover scaling.
 */
export function MediaRow({ title, eyebrow, seeAll, children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [update]);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const arrow = "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full glass-strong text-foreground opacity-0 transition-[opacity,background-color,transform] duration-300 hover:scale-105 hover:bg-primary hover:text-primary-foreground group-hover/row:opacity-100 focus-visible:opacity-100 md:grid";

  return (
    <section aria-label={title} className={cn("group/row", className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h2 className={cn("text-h3 font-semibold", eyebrow && "mt-3")}>{title}</h2>
        </div>
        {seeAll ? (
          <Link to="/browse" className="text-small group/all inline-flex items-center gap-1 font-medium text-muted-foreground underline decoration-border underline-offset-[6px] transition-colors hover:text-foreground hover:decoration-primary">
            See all <span aria-hidden className="transition-transform duration-200 group-hover/all:translate-x-0.5">→</span>
          </Link>
        ) : null}
      </div>
      <div className="relative">
        {canPrev ? (
          <button type="button" aria-label={`Scroll ${title} left`} onClick={() => scroll(-1)} className={cn(arrow, "-left-4")}>
            <ChevronLeft className="size-5" />
          </button>
        ) : null}
        <div
          ref={ref}
          className={cn(
            "no-scrollbar -mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-2 pb-6 pt-5 md:gap-5",
            canNext && "row-mask",
          )}
        >
          {children}
        </div>
        {canNext ? (
          <button type="button" aria-label={`Scroll ${title} right`} onClick={() => scroll(1)} className={cn(arrow, "-right-4")}>
            <ChevronRight className="size-5" />
          </button>
        ) : null}
      </div>
    </section>
  );
}

/** Fixed-width snap item for poster rows. */
export const posterItem = "w-[9.5rem] shrink-0 snap-start sm:w-[11rem] lg:w-[12.5rem]";
