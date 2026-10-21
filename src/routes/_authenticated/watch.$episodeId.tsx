import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Lock, Play } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { BrandLogo } from "@/components/brand/Logo";
import { RichText } from "@/components/content/RichText";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { Eyebrow } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import { getPlaybackSource, type PlaybackResult } from "@/lib/playback.functions";
import { saveProgress } from "@/lib/progress";
import { formatDuration, formatTaka } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/watch/$episodeId")({
  head: () => ({
    meta: [
      { title: "Now playing — Branta Films" },
      { name: "description", content: "Watch Branta Films originals." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Now playing — Branta Films" },
      { property: "og:description", content: "Watch Branta Films originals." },
      { property: "og:type", content: "video.episode" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WatchPage,
});

function useWatchData(episodeId: string, userId: string | undefined) {
  return useQuery({
    queryKey: ["watch", episodeId, userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data: ep, error } = await supabase
        .from("episodes")
        .select("id, series_id, episode_number, title, synopsis_html, duration_seconds, is_free, series:series_id(id, slug, title, poster_url, backdrop_url, price_bdt)")
        .eq("id", episodeId)
        .maybeSingle();
      if (error) throw error;
      if (!ep) return null;
      const [{ data: siblings }, { data: progress }] = await Promise.all([
        supabase.from("episodes").select("id, episode_number, title, duration_seconds, is_free").eq("series_id", ep.series_id).order("episode_number"),
        supabase.from("watch_progress").select("position_seconds, completed").eq("user_id", userId!).eq("episode_id", episodeId).maybeSingle(),
      ]);
      return {
        episode: ep,
        series: ep.series as unknown as { id: string; slug: string; title: string; poster_url: string | null; backdrop_url: string | null; price_bdt: number },
        siblings: siblings ?? [],
        resumeAt: progress && !progress.completed ? Number(progress.position_seconds) : 0,
      };
    },
  });
}

function WatchPage() {
  const { episodeId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchSource = useServerFn(getPlaybackSource);
  const { data, isPending } = useWatchData(episodeId, user?.id);
  const [initial, setInitial] = useState<PlaybackResult | null>(null);
  const firstRef = useRef<PlaybackResult | null>(null);

  useEffect(() => {
    setInitial(null);
    firstRef.current = null;
    let cancelled = false;
    void fetchSource({ data: { episodeId } }).then((res) => {
      if (cancelled) return;
      firstRef.current = res;
      setInitial(res);
    });
    return () => {
      cancelled = true;
    };
  }, [episodeId, fetchSource]);

  const getSource = useCallback(async () => {
    const cached = firstRef.current;
    firstRef.current = null;
    const res = cached ?? (await fetchSource({ data: { episodeId } }));
    return res.status === "allowed" ? { url: res.url, expiresAt: res.expiresAt } : null;
  }, [episodeId, fetchSource]);

  const onProgress = useCallback(
    (position: number, duration: number, completed: boolean) => {
      if (!user || !data) return;
      void saveProgress({ userId: user.id, episodeId, seriesId: data.series.id, position, duration, completed }).then(() =>
        queryClient.invalidateQueries({ queryKey: ["continue-watching"] }),
      );
    },
    [user, data, episodeId, queryClient],
  );

  const next = data?.siblings.find((s) => s.episode_number === (data.episode.episode_number ?? 0) + 1);

  return (
    <div className="min-h-svh bg-background">
      <header className="flex h-14 items-center gap-4 border-b border-border px-[clamp(1rem,3vw,2rem)]">
        {data ? (
          <Link to="/series/$slug" params={{ slug: data.series.slug }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> {data.series.title}
          </Link>
        ) : (
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back
          </Link>
        )}
        <div className="ml-auto">
          <BrandLogo />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-8 px-[clamp(1rem,3vw,2rem)] py-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-md border border-border bg-surface">
            {isPending || !initial ? (
              <div className="aspect-video animate-pulse bg-surface" />
            ) : !data ? (
              <StatusPanel title="Episode not found" body="This episode isn't available." />
            ) : initial.status === "allowed" ? (
              <VideoPlayer
                key={episodeId}
                getSource={getSource}
                startAt={data.resumeAt}
                poster={mediaUrl(data.series.backdrop_url)}
                title={`${data.series.title} · E${data.episode.episode_number} ${data.episode.title}`}
                onProgress={onProgress}
                onEnded={() => next && void navigate({ to: "/watch/$episodeId", params: { episodeId: next.id } })}
              />
            ) : initial.status === "locked" ? (
              <StatusPanel
                icon={<Lock className="size-6 text-primary" />}
                title="This episode is locked"
                body={`Unlock all episodes of ${data.series.title} for ${formatTaka(data.series.price_bdt)}. bKash & Nagad payments open soon.`}
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link to="/series/$slug" params={{ slug: data.series.slug }}>View series</Link>
                  </Button>
                }
              />
            ) : initial.status === "not_uploaded" ? (
              <StatusPanel title="Coming soon" body="This episode's video hasn't been uploaded yet." />
            ) : initial.status === "not_configured" ? (
              <StatusPanel title="Playback unavailable" body="We couldn't reach the video library. Please try again in a moment." />
            ) : (
              <StatusPanel title="Episode unavailable" body="This episode isn't available right now." />
            )}
          </div>
          {data ? (
            <div className="mt-6">
              <Eyebrow>Episode {data.episode.episode_number}</Eyebrow>
              <h1 className="mt-3 text-h2">{data.episode.title}</h1>
              <RichText html={data.episode.synopsis_html} className="mt-4 max-w-3xl text-foreground/80" />
            </div>
          ) : null}
        </div>

        {data ? (
          <aside aria-label="Episodes" className="xl:sticky xl:top-6 xl:self-start">
            <h2 className="text-eyebrow text-muted-foreground">Episodes</h2>
            <ol className="mt-4 space-y-1">
              {data.siblings.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/watch/$episodeId"
                    params={{ episodeId: s.id }}
                    className={cn(
                      "text-small flex items-center gap-3 rounded-md px-3 py-3 transition-colors hover:bg-surface",
                      s.id === episodeId && "bg-surface text-primary",
                    )}
                  >
                    <span className="w-6 font-mono text-xs text-muted-foreground">{String(s.episode_number).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate">{s.title}</span>
                    {s.id === episodeId ? <Play className="size-3.5 fill-current" /> : null}
                    <span className="font-mono text-xs text-muted-foreground">{s.is_free ? "Free" : formatDuration(s.duration_seconds)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function StatusPanel({ title, body, icon, action }: { title: string; body: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center">
      {icon ? <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">{icon}</div> : null}
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}
