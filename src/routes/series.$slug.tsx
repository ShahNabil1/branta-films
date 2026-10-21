import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, Lock, Play } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { RichText } from "@/components/content/RichText";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import { seriesQuery } from "@/lib/queries";
import { richTextToPlain } from "@/lib/rich-text";
import { formatDuration, formatTaka } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/series/$slug")({
  loader: async ({ context, params }) => {
    const series = await context.queryClient.ensureQueryData(seriesQuery(params.slug));
    if (!series) throw notFound();
    return { title: series.title, description: series.tagline || richTextToPlain(series.description_html).slice(0, 160) };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — Branta Films` : "Series — Branta Films";
    const description = loaderData?.description ?? "Watch on Branta Films.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "video.tv_show" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: SeriesPage,
});

function SeriesPage() {
  const { slug } = Route.useParams();
  const { data: series } = useSuspenseQuery(seriesQuery(slug));
  const { user, isStaff } = useAuth();
  const { data: unlocked } = useQuery({
    queryKey: ["unlock", series?.id, user?.id],
    enabled: Boolean(user && series),
    queryFn: async () => {
      const { data } = await supabase.from("series_unlocks").select("id").eq("series_id", series!.id).eq("user_id", user!.id).maybeSingle();
      return Boolean(data);
    },
  });
  if (!series) return null;

  const hasAccess = Boolean(unlocked) || isStaff;
  const backdrop = mediaUrl(series.backdrop_url);
  const poster = mediaUrl(series.poster_url);
  const first = series.episodes[0];

  return (
    <SiteShell overlayHeader>
      <section className="relative isolate overflow-hidden">
        {backdrop ? <img src={backdrop} alt="" width={1920} height={1080} className="absolute inset-0 -z-20 size-full object-cover opacity-60" /> : null}
        <div className="hero-fade absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-[1440px] gap-10 px-[clamp(1.25rem,4vw,3rem)] pb-14 pt-32 md:grid-cols-[240px_1fr] md:items-end">
          {poster ? (
            <img src={poster} alt={`${series.title} poster`} width={600} height={900} className="hidden aspect-[2/3] w-60 rounded-md border border-border object-cover md:block" />
          ) : null}
          <div>
            <p className="text-eyebrow text-primary">{series.genres.join(" / ")}</p>
            <h1 className="mt-4 text-h1">{series.title}</h1>
            {series.tagline ? <p className="mt-4 max-w-2xl text-lg text-foreground/80">{series.tagline}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
              <span className="rounded-sm border border-border px-1.5 py-0.5">{series.maturity_rating}</span>
              <span>{series.release_year}</span>
              <span>{series.episodes.length} episodes</span>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {first ? (
                <Button asChild size="lg" className="h-12 rounded-sm px-6 text-base">
                  <Link to="/watch/$episodeId" params={{ episodeId: first.id }}>
                    <Play className="fill-current" /> {first.is_free ? "Play episode 1 free" : "Play episode 1"}
                  </Link>
                </Button>
              ) : null}
              {series.price_bdt > 0 ? (
                hasAccess ? (
                  <span className="inline-flex items-center gap-2 text-sm text-success">
                    <CheckCircle2 className="size-4" /> Full series unlocked
                  </span>
                ) : (
                  <div className="flex flex-col gap-1">
                    <Button size="lg" variant="outline" className="h-12 rounded-sm bg-transparent px-6 text-base" disabled>
                      <Lock /> Unlock all episodes · {formatTaka(series.price_bdt)}
                    </Button>
                    <span className="text-xs text-muted-foreground">bKash & Nagad payments open soon.</span>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1440px] gap-14 px-[clamp(1.25rem,4vw,3rem)] py-14 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="episodes-title">
          <h2 id="episodes-title" className="text-h3">Episodes</h2>
          <ol className="mt-6 divide-y divide-border border-y border-border">
            {series.episodes.map((ep) => {
              const open = ep.is_free || hasAccess;
              return (
                <li key={ep.id}>
                  <Link
                    to="/watch/$episodeId"
                    params={{ episodeId: ep.id }}
                    className="group grid grid-cols-[3rem_1fr_auto] items-start gap-4 py-5 transition-colors hover:bg-surface/60"
                  >
                    <span className="pt-0.5 font-mono text-lg text-muted-foreground">{String(ep.episode_number).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="font-medium transition-colors group-hover:text-primary">{ep.title}</p>
                      <RichText html={ep.synopsis_html} className="mt-1 text-sm text-muted-foreground" />
                    </div>
                    <div className="flex flex-col items-end gap-2 pt-0.5">
                      <span className="font-mono text-xs text-muted-foreground">{formatDuration(ep.duration_seconds)}</span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                          ep.is_free ? "bg-primary/15 text-primary" : open ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {ep.is_free ? "Free" : open ? "Unlocked" : (<><Lock className="size-3" /> Locked</>)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
        <aside aria-labelledby="about-title">
          <h2 id="about-title" className="text-h3">About</h2>
          <RichText html={series.description_html} className="mt-6 text-foreground/85" />
        </aside>
      </div>
    </SiteShell>
  );
}
