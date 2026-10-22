import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const arrow = "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/85 text-foreground opacity-0 backdrop-blur-md transition-[opacity,border-color] duration-300 hover:border-foreground group-hover/row:opacity-100 focus-visible:opacity-100 md:grid";

  return (
    <section aria-label={title} className={cn("group/row", className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h2 className={cn("text-h3", eyebrow && "mt-3")}>{title}</h2>
        </div>
        {seeAll ? (
          <Button asChild variant="outline" className="discover-action h-10 shrink-0 gap-2 px-4">
            <Link to="/browse">See all <ArrowRight aria-hidden className="size-4" /></Link>
          </Button>
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
