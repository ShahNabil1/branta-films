import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Info, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CatalogSeries } from "@/lib/catalog.functions";
import { mediaUrl } from "@/lib/media";
import { formatTaka } from "@/lib/format";
import { cn } from "@/lib/utils";

const SLIDE_MS = 8000;

/**
 * Cinematic featured banner. Backdrops cross-fade with a slow Ken Burns push-in; the active
 * thumbnail's progress bar drives auto-advance, so pausing the bar (hover/focus) pauses rotation.
 */
export function HeroCarousel({ slides }: { slides: CatalogSeries[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const count = slides.length;

  useEffect(() => {
    setAutoplay(count > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, [count]);

  if (!count) return null;
  const current = slides[index] ?? slides[0]!;
  const freeEp = current.episodes.find((e) => e.is_free);
  const next = () => setIndex((i) => (i + 1) % count);
  const fillStyle = { ["--fill-duration" as string]: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" } as CSSProperties;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured series"
      className="relative isolate flex min-h-[600px] items-end overflow-hidden h-[min(94svh,900px)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.map((s, i) => {
        const src = mediaUrl(s.backdrop_url ?? s.poster_url);
        const active = i === index;
        return (
          <div
            key={s.id}
            aria-hidden="true"
            className={cn("absolute inset-0 -z-20 overflow-hidden transition-opacity duration-[1200ms] ease-out", active ? "opacity-100" : "opacity-0")}
          >
            {src ? (
              <img
                src={src}
                alt=""
                width={1920}
                height={1080}
                fetchPriority={i === 0 ? "high" : "low"}
                loading={i === 0 ? "eager" : "lazy"}
                className={cn("size-full object-cover", active && "animate-ken-burns")}
              />
            ) : null}
          </div>
        );
      })}
      <div className="cinema-mask absolute inset-0 -z-10" />
      {autoplay ? (
        // Invisible timer shared by every screen size; the visible bars run the same animation in sync.
        <span key={index} aria-hidden="true" className="animate-fill-x pointer-events-none absolute size-px opacity-0" style={fillStyle} onAnimationEnd={next} />
      ) : null}

      <div className="mx-auto grid w-full max-w-[1440px] items-end gap-10 px-[clamp(1.25rem,4vw,3rem)] pb-32 pt-28 md:pb-40 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div key={current.id} className="max-w-2xl">
          <p className="animate-fade-up inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-eyebrow text-foreground/90">
            <span className="size-1.5 rounded-full bg-primary shadow-glow-soft" />
            Branta Original
            <span className="text-muted-foreground">· {current.genres.join(" / ")}</span>
          </p>
          <h1 className="animate-fade-up text-cinema-shadow mt-5 max-w-[14ch] text-display [animation-delay:60ms]">{current.title}</h1>
          {current.tagline ? (
            <p className="animate-fade-up text-cinema-shadow mt-5 max-w-xl text-lg leading-relaxed text-foreground/85 [animation-delay:120ms]">
              {current.tagline}
            </p>
          ) : null}
          <div className="animate-fade-up mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-foreground/75 [animation-delay:160ms]">
            {current.maturity_rating ? <span className="rounded-sm border border-foreground/30 px-1.5 py-0.5">{current.maturity_rating}</span> : null}
            {current.release_year ? <span>{current.release_year}</span> : null}
            <span>{current.episodes.length} episodes</span>
            {freeEp ? <span className="text-primary">Episode 1 free</span> : null}
            {current.price_bdt > 0 ? <span>Full season {formatTaka(current.price_bdt)}</span> : null}
          </div>
          <div className="animate-fade-up mt-8 flex flex-wrap gap-3 [animation-delay:220ms]">
            <Button asChild variant="hero" size="xl" className="rounded-full">
              {freeEp ? (
                <Link to="/watch/$episodeId" params={{ episodeId: freeEp.id }}>
                  <Play className="fill-current" /> Watch now
                </Link>
              ) : (
                <Link to="/series/$slug" params={{ slug: current.slug }}>
                  <Play className="fill-current" /> Watch now
                </Link>
              )}
            </Button>
            <Button asChild variant="glass" size="xl" className="rounded-full">
              <Link to="/series/$slug" params={{ slug: current.slug }}>
                <Info /> Details
              </Link>
            </Button>
          </div>
        </div>

        {count > 1 ? (
          <div role="tablist" aria-label="Choose featured series" className="hidden gap-3 lg:flex">
            {slides.map((s, i) => {
              const active = i === index;
              const thumb = mediaUrl(s.backdrop_url ?? s.poster_url);
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={s.title}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "group/thumb relative w-44 overflow-hidden rounded-lg glass p-1.5 text-left transition-[transform,box-shadow,opacity] duration-500",
                    active ? "shadow-glow" : "opacity-70 hover:-translate-y-1 hover:opacity-100",
                  )}
                >
                  <div className="aspect-video overflow-hidden rounded-md bg-surface">
                    {thumb ? <img src={thumb} alt="" loading="lazy" width={320} height={180} className="size-full object-cover transition-transform duration-700 group-hover/thumb:scale-110" /> : null}
                  </div>
                  <p className="mt-1.5 truncate px-0.5 text-xs font-medium">{s.title}</p>
                  <span className="absolute inset-x-1.5 bottom-1 h-0.5 overflow-hidden rounded-full bg-foreground/15">
                    {active ? (
                      autoplay ? (
                        <span
                          key={index}
                          className="animate-fill-x block h-full bg-primary"
                          style={fillStyle}
                        />
                      ) : (
                        <span className="block h-full bg-primary" />
                      )
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="absolute inset-x-0 bottom-24 flex justify-center gap-1 md:bottom-32 lg:hidden">
          {slides.map((s, i) => (
            <button key={s.id} type="button" aria-label={`Show ${s.title}`} aria-current={i === index} onClick={() => setIndex(i)} className="grid h-8 w-8 place-items-center">
              <span className={cn("block h-1.5 rounded-full transition-all duration-500", i === index ? "w-7 bg-primary" : "w-1.5 bg-foreground/40")} />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
