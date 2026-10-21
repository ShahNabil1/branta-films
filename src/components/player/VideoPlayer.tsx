import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { formatClock } from "@/lib/format";
import { PROGRESS_SAVE_INTERVAL_MS, isCompleted } from "@/lib/access";
import { cn } from "@/lib/utils";

type Props = {
  /** Fetches a fresh short-lived link; called on start and whenever the link expires. */
  getSource: () => Promise<{ url: string; expiresAt: number } | null>;
  startAt?: number;
  poster?: string | null;
  title: string;
  onProgress: (position: number, duration: number, completed: boolean) => void;
  onEnded?: () => void;
};

/**
 * Branded HTML5 player. Never stores the video address in the page —
 * the signed link is attached to the element only and refreshed before expiry.
 */
export function VideoPlayer({ getSource, startAt = 0, poster, title, onProgress, onEnded }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const expiresRef = useRef(0);
  const lastSaveRef = useRef(0);
  const resumeRef = useRef(startAt);
  const hideTimer = useRef<number | undefined>(undefined);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [controls, setControls] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (position: number, autoplay: boolean) => {
      const v = videoRef.current;
      if (!v) return;
      setLoading(true);
      const src = await getSource().catch(() => null);
      if (!src) {
        setLoading(false);
        setError("We couldn't start this episode. Please try again.");
        return;
      }
      expiresRef.current = src.expiresAt;
      resumeRef.current = position;
      v.src = src.url;
      v.load();
      if (autoplay) void v.play().catch(() => undefined);
    },
    [getSource],
  );

  useEffect(() => {
    void load(startAt, false);
    const v = videoRef.current;
    return () => {
      if (v) {
        if (v.currentTime > 0) onProgress(v.currentTime, v.duration || 0, isCompleted(v.currentTime, v.duration || 0));
        v.removeAttribute("src");
        v.load();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh the signed link a minute before it expires, keeping position.
  useEffect(() => {
    const id = window.setInterval(() => {
      const v = videoRef.current;
      if (!v || !expiresRef.current) return;
      if (Date.now() > expiresRef.current - 60_000) {
        const wasPlaying = !v.paused;
        void load(v.currentTime, wasPlaying);
      }
    }, 20_000);
    return () => window.clearInterval(id);
  }, [load]);

  // Save progress when the tab is hidden or closed.
  useEffect(() => {
    const flush = () => {
      const v = videoRef.current;
      if (v && v.currentTime > 0) onProgress(v.currentTime, v.duration || 0, isCompleted(v.currentTime, v.duration || 0));
    };
    const onVis = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
    };
  }, [onProgress]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v || error) return;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
  };
  const seek = (delta: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min((v.duration || 0) - 0.5, v.currentTime + delta));
  };
  const toggleFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrapRef.current?.requestFullscreen?.();
  };
  const poke = () => {
    setControls(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControls(false);
    }, 2800);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === " " || k === "k") {
      e.preventDefault();
      toggle();
    } else if (k === "arrowright" || k === "l") seek(10);
    else if (k === "arrowleft" || k === "j") seek(-10);
    else if (k === "f") toggleFs();
    else if (k === "m") setMuted((m) => !m);
    poke();
  };

  const pct = duration ? (time / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      className={cn("group relative aspect-video w-full overflow-hidden bg-background outline-none", fullscreen && "aspect-auto h-full", !controls && "cursor-none")}
      tabIndex={0}
      onKeyDown={onKey}
      onMouseMove={poke}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={`Video player: ${title}`}
    >
      <video
        ref={videoRef}
        className="size-full"
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        onClick={toggle}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setDuration(v.duration || 0);
          if (resumeRef.current > 0 && resumeRef.current < (v.duration || 0) - 5) v.currentTime = resumeRef.current;
          setLoading(false);
          setError(null);
        }}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlay={() => {
          setPlaying(true);
          poke();
        }}
        onPause={(e) => {
          setPlaying(false);
          setControls(true);
          const v = e.currentTarget;
          onProgress(v.currentTime, v.duration || 0, isCompleted(v.currentTime, v.duration || 0));
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setTime(v.currentTime);
          if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
          if (Date.now() - lastSaveRef.current >= PROGRESS_SAVE_INTERVAL_MS) {
            lastSaveRef.current = Date.now();
            onProgress(v.currentTime, v.duration || 0, isCompleted(v.currentTime, v.duration || 0));
          }
        }}
        onEnded={(e) => {
          const v = e.currentTarget;
          onProgress(v.duration || v.currentTime, v.duration || 0, true);
          onEnded?.();
        }}
        onError={() => {
          // An expired link fails here: fetch a fresh one and resume.
          const v = videoRef.current;
          if (v && Date.now() > expiresRef.current - 60_000) void load(v.currentTime || resumeRef.current, true);
          else {
            setLoading(false);
            setError("This video can't be played right now.");
          }
        }}
        muted={muted}
        ref-volume={volume}
      />

      {loading && !error ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-10 animate-spin text-primary" aria-label="Loading" />
        </div>
      ) : null}

      {!playing && !loading && !error ? (
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-0 m-auto flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-105"
          aria-label="Play"
        >
          <Play className="size-8 translate-x-0.5 fill-current" />
        </button>
      ) : null}

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-scrim px-6 text-center">
          <p className="text-sm text-media-ink">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              void load(time || resumeRef.current, true);
            }}
            className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Try again
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/70 to-transparent px-4 pb-3 pt-14 transition-opacity duration-300",
          controls || !playing ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="group/bar relative h-4 cursor-pointer">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-foreground/20">
            <div className="absolute inset-y-0 left-0 rounded-full bg-foreground/30" style={{ width: `${bufPct}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={time}
            onChange={(e) => {
              const v = videoRef.current;
              if (v) v.currentTime = Number(e.target.value);
            }}
            className="absolute inset-0 w-full cursor-pointer opacity-0"
            aria-label="Seek"
          />
        </div>
        <div className="mt-1 flex items-center gap-1 text-media-ink">
          <PlayerButton label={playing ? "Pause" : "Play"} onClick={toggle}>
            {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
          </PlayerButton>
          <PlayerButton label="Back 10 seconds" onClick={() => seek(-10)}>
            <RotateCcw />
          </PlayerButton>
          <PlayerButton label="Forward 10 seconds" onClick={() => seek(10)}>
            <RotateCw />
          </PlayerButton>
          <PlayerButton label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((m) => !m)}>
            {muted || volume === 0 ? <VolumeX /> : <Volume2 />}
          </PlayerButton>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const val = Number(e.target.value);
              setVolume(val);
              setMuted(val === 0);
              if (videoRef.current) videoRef.current.volume = val;
            }}
            className="hidden w-20 accent-primary sm:block"
            aria-label="Volume"
          />
          <span className="ml-3 font-mono text-xs text-media-ink/80">
            {formatClock(time)} / {formatClock(duration)}
          </span>
          <span className="ml-auto hidden truncate pr-3 text-sm text-media-ink/80 md:block">{title}</span>
          <PlayerButton label={fullscreen ? "Exit full screen" : "Full screen"} onClick={toggleFs}>
            {fullscreen ? <Minimize /> : <Maximize />}
          </PlayerButton>
        </div>
      </div>
    </div>
  );
}

function PlayerButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-10 items-center justify-center rounded-sm transition-colors hover:text-primary [&_svg]:size-5"
    >
      {children}
    </button>
  );
}
