import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX, Settings2, Check, X } from "lucide-react";
import { formatClock } from "@/lib/format";
import { PROGRESS_SAVE_INTERVAL_MS, isCompleted } from "@/lib/access";
import { Button } from "@/components/ui/button";
import { PLAYBACK_SPEEDS, QUALITY_HEIGHTS, seekTarget, networkQualityCap } from "@/lib/player-rules";
import type Hls from "hls.js";
import { cn } from "@/lib/utils";
import { BrandedDialog } from "@/components/ui/branded-dialog";

type Props = {
  /** Fetches a fresh short-lived link; called on start and whenever the link expires. */
  getSource: () => Promise<{ url: string; expiresAt: number } | null>;
  startAt?: number;
  poster?: string | null;
  title: string;
  onProgress: (position: number, duration: number, completed: boolean) => void;
  onEnded?: () => void;
  onPlayingChange?: (playing: boolean) => void;
};

/**
 * Branded HTML5 player. Never stores the video address in the page —
 * the signed link is attached to the element only and refreshed before expiry.
 */
export function VideoPlayer({ getSource, startAt = 0, poster, title, onProgress, onEnded, onPlayingChange }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const expiresRef = useRef(0);
  const lastSaveRef = useRef(0);
  const resumeRef = useRef(startAt);
  const hideTimer = useRef<number | undefined>(undefined);

  const hlsRef = useRef<Hls | null>(null);
  const sourceGeneration = useRef(0);
  const autoplayRef = useRef(false);
  const speedRef = useRef(1);
  const qualityRef = useRef<number | "auto">("auto");
  const tapRef = useRef({ at: 0, side: "" });
  const feedbackTimer = useRef<number | undefined>(undefined);
  const [settings, setSettings] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState<number | "auto">("auto");
  const [levels, setLevels] = useState<number[]>([]);
  const [nativeHeight, setNativeHeight] = useState(0);
  const [seekFeedback, setSeekFeedback] = useState<number | null>(null);
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
      const generation = ++sourceGeneration.current;
      const src = await getSource().catch(() => null);
      if (generation !== sourceGeneration.current) return;
      if (!src) {
        setLoading(false);
        setError("We couldn't start this episode. Please try again.");
        return;
      }
      expiresRef.current = src.expiresAt;
      resumeRef.current = position;
      autoplayRef.current = autoplay;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      setLevels([]);
      // Import only in the browser. An MP4 is never presented as multiple resolutions.
      if (/\.m3u8(?:[?#]|$)/i.test(src.url)) {
        const { default: HlsEngine } = await import("hls.js");
        if (generation !== sourceGeneration.current) return;
        if (HlsEngine.isSupported()) {
          const hls = new HlsEngine({ capLevelToPlayerSize: true });
          hlsRef.current = hls;
          hls.on(HlsEngine.Events.MANIFEST_PARSED, () => {
            setLevels([...new Set(hls.levels.map(level => level.height))].sort((a,b) => a-b));
            const selected = qualityRef.current;
            hls.currentLevel = selected === "auto" ? -1 : hls.levels.findIndex(level => level.height === selected);
          });
          hls.on(HlsEngine.Events.ERROR, (_event, detail) => {
            if (!detail.fatal) return;
            if (detail.type === HlsEngine.ErrorTypes.NETWORK_ERROR && Date.now() > expiresRef.current - 60_000) void load(v.currentTime, !v.paused);
            else if (detail.type === HlsEngine.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
            else { setLoading(false); setError("This stream can't be played right now."); }
          });
          hls.loadSource(src.url);
          hls.attachMedia(v);
          return;
        }
      }
      v.src = src.url;
      v.load();
    },
    [getSource],
  );

  useEffect(() => {
    void load(startAt, false);
    const v = videoRef.current;
    return () => {
      ++sourceGeneration.current;
      hlsRef.current?.destroy();
      window.clearTimeout(hideTimer.current);
      window.clearTimeout(feedbackTimer.current);
      onPlayingChange?.(false);
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
    const onFs = () => {
      setFullscreen(Boolean(document.fullscreenElement));
      if (!document.fullscreenElement) screen.orientation?.unlock?.();
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v || error) return;
    if (v.paused) void v.play().catch(() => { setLoading(false); setError("Playback did not start. Tap Try again."); });
    else v.pause();
  };
  const seek = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = seekTarget(v.currentTime, v.duration, delta);
    setTime(v.currentTime);
    setSeekFeedback(delta);
    window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setSeekFeedback(null), 700);
  };
  const toggleFs = async () => {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      const wrap = wrapRef.current;
      if (wrap?.requestFullscreen) {
        await wrap.requestFullscreen();
        const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
        await orientation?.lock?.("landscape").catch(() => undefined);
      } else {
        const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
        video?.webkitEnterFullscreen?.();
      }
    } catch { /* Fullscreen/orientation is controlled by the device, never interrupt playback. */ }
  };
  const applyQuality = (height: number | "auto") => {
    const hls = hlsRef.current;
    if (height !== "auto" && !levels.includes(height)) return;
    qualityRef.current = height;
    setQuality(height);
    if (hls) hls.currentLevel = height === "auto" ? -1 : hls.levels.findIndex(level => level.height === height);
  };
  const onSurfaceTap = (event: React.PointerEvent<HTMLVideoElement>) => {
    if (event.pointerType === "mouse") { toggle(); poke(); return; }
    const bounds = event.currentTarget.getBoundingClientRect();
    const side = event.clientX - bounds.left < bounds.width / 2 ? "left" : "right";
    const now = performance.now();
    if (now - tapRef.current.at < 320 && tapRef.current.side === side) {
      seek(side === "right" ? 10 : -10);
      tapRef.current = { at: 0, side: "" };
    } else { tapRef.current = { at: now, side }; }
    poke();
  };
  const poke = () => {
    setControls(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !settings) setControls(false);
    }, 2800);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return;
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

  useEffect(() => {
    type Connection = EventTarget & { downlink?: number; saveData?: boolean };
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    const update = () => {
      const hls = hlsRef.current;
      if (!hls) return;
      const cap = networkQualityCap(connection?.downlink, connection?.saveData);
      const eligible = hls.levels.map((level, index) => ({ height: level.height, index })).filter(level => level.height <= cap);
      hls.autoLevelCapping = eligible.at(-1)?.index ?? 0;
    };
    update();
    connection?.addEventListener("change", update);
    return () => connection?.removeEventListener("change", update);
  }, [levels]);

  const pct = duration ? (time / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      className={cn("player-theme group relative aspect-video w-full overflow-hidden bg-background outline-none", fullscreen && "aspect-auto h-full", !controls && "cursor-none")}
      tabIndex={0}
      onKeyDown={onKey}
      onMouseMove={poke}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={`Video player: ${title}`}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 size-full object-contain"
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        onPointerUp={onSurfaceTap}
        onDoubleClick={(event) => { if (event.detail && window.matchMedia("(pointer: fine)").matches) void toggleFs(); }}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setDuration(v.duration || 0);
          setNativeHeight(v.videoHeight);
          v.playbackRate = speedRef.current;
          if (resumeRef.current > 0 && resumeRef.current < (v.duration || 0)) v.currentTime = resumeRef.current;
          if (autoplayRef.current) { autoplayRef.current = false; void v.play().catch(() => undefined); }
          setLoading(false);
          setError(null);
        }}
        onWaiting={() => { setLoading(true); onPlayingChange?.(false); }}
        onCanPlay={() => { setLoading(false); }}
        onPlaying={() => { setLoading(false); onPlayingChange?.(true); }}
        onPlay={() => {
          setPlaying(true);
          poke();
        }}
        onPause={(e) => {
          setPlaying(false);
          onPlayingChange?.(false);
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
          onPlayingChange?.(false);
          const v = e.currentTarget;
          onProgress(v.duration || v.currentTime, v.duration || 0, true);
          onEnded?.();
        }}
        onError={() => {
          onPlayingChange?.(false);
          // An expired link fails here: fetch a fresh one and resume.
          const v = videoRef.current;
          if (v && Date.now() > expiresRef.current - 60_000) void load(v.currentTime || resumeRef.current, true);
          else {
            setLoading(false);
            setError("This video can't be played right now.");
          }
        }}
        muted={muted}
      />

      {loading && !error ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-10 animate-spin text-primary" aria-label="Loading" />
        </div>
      ) : null}

      {!playing && !loading && !error ? (
        <Button
          type="button"
          onClick={toggle}
          className="player-start cinema-action absolute inset-0 m-auto size-14 p-0 sm:size-20 [&_svg]:size-7 sm:[&_svg]:size-8"
          aria-label="Play"
        >
          <Play className="size-8 translate-x-0.5 fill-current" />
        </Button>
      ) : null}

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-scrim px-6 text-center">
          <p className="text-sm text-media-ink">{error}</p>
          <Button
            type="button"
            onClick={() => {
              setError(null);
              void load(time || resumeRef.current, true);
            }}
            className="cinema-action"
          >
            Try again
          </Button>
        </div>
      ) : null}

      {seekFeedback !== null ? <div aria-live="polite" className={cn("player-seek-feedback pointer-events-none absolute top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 rounded-full bg-scrim p-5 text-media-ink", seekFeedback > 0 ? "right-[15%]" : "left-[15%]")}>{seekFeedback > 0 ? <RotateCw className="size-6" /> : <RotateCcw className="size-6" />}<span className="text-sm font-medium">10 seconds</span></div> : null}
      <BrandedDialog open={settings} onClose={() => { setSettings(false); poke(); }} title="Playback settings" container={fullscreen ? wrapRef.current : undefined} className="player-theme max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <h3 className="mb-2 text-sm text-muted-foreground">Quality</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button variant={quality === "auto" ? "default" : "secondary"} size="sm" aria-pressed={quality === "auto"} onClick={() => applyQuality("auto")} className="px-2">Auto {quality === "auto" ? <Check /> : null}</Button>
          {QUALITY_HEIGHTS.map(height => <Button key={height} size="sm" variant={quality === height ? "default" : "secondary"} disabled={!levels.includes(height)} aria-pressed={quality === height} onClick={() => applyQuality(height)} className="px-2">{height}p</Button>)}
        </div>
        {!levels.length ? <p className="mt-2 text-xs text-muted-foreground">Original{nativeHeight ? ` · ${nativeHeight}p` : ""}. Other resolutions are not available for this video.</p> : <p className="mt-2 text-xs text-muted-foreground">Auto adjusts to your connection.</p>}
        <h3 className="mb-2 mt-4 text-sm text-muted-foreground">Playback speed</h3>
        <div className="grid grid-cols-3 gap-2">{PLAYBACK_SPEEDS.map(rate => <Button key={rate} variant={speed === rate ? "default" : "secondary"} size="sm" className="px-2" aria-pressed={speed === rate} onClick={() => { speedRef.current = rate; setSpeed(rate); if (videoRef.current) videoRef.current.playbackRate = rate; }}>{rate}x</Button>)}</div>
      </BrandedDialog>
      <BrandedDialog open={volumeOpen} onClose={() => setVolumeOpen(false)} title="Volume" container={fullscreen ? wrapRef.current : undefined} className="player-theme">
        <div className="flex items-center gap-4"><PlayerButton label={muted ? "Unmute" : "Mute"} onClick={() => setMuted(m => !m)}>{muted ? <VolumeX/> : <Volume2/>}</PlayerButton><input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} aria-label="Volume" className="h-11 min-w-0 flex-1 touch-pan-y accent-primary" onChange={e => { const value = Number(e.target.value); setVolume(value); setMuted(value === 0); if (videoRef.current) videoRef.current.volume = value; }}/><span className="w-10 text-right text-sm tabular-nums">{Math.round((muted ? 0 : volume) * 100)}%</span></div>
      </BrandedDialog>
      <div
        inert={!controls && playing && !settings}
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/70 to-transparent px-2 pb-2 pt-8 sm:px-4 sm:pb-3 sm:pt-14 transition-opacity duration-300",
          controls || !playing || settings ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="pointer-events-auto group/bar relative h-4 cursor-pointer touch-none">
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
        <div className="pointer-events-auto mt-1 grid grid-cols-[auto_auto_auto_minmax(0,1fr)_auto_auto] items-center text-media-ink sm:flex sm:gap-1">
          <PlayerButton label={playing ? "Pause" : "Play"} onClick={toggle}>
            {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
          </PlayerButton>
          <span className="hidden sm:contents"><PlayerButton label="Back 10 seconds" onClick={() => seek(-10)}>
            <RotateCcw />
          </PlayerButton>
          <PlayerButton label="Forward 10 seconds" onClick={() => seek(10)}>
            <RotateCw />
          </PlayerButton></span>
          <PlayerButton label="Adjust volume" onClick={() => { setVolumeOpen(true); setControls(true); }}>
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
          <span className="col-span-2 min-w-0 whitespace-nowrap text-[10px] tabular-nums text-media-ink/80 sm:ml-3 sm:text-xs">
            {formatClock(time)} / {formatClock(duration)}
          </span>
          <span className="ml-auto hidden truncate pr-3 text-sm text-media-ink/80 md:block">{title}</span>
          <PlayerButton label="Playback settings" onClick={() => { setSettings(open => !open); setControls(true); window.clearTimeout(hideTimer.current); }}><Settings2 /></PlayerButton>
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
    <Button
      variant="ghost"
      size="icon"
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="player-control size-11 shrink-0 text-media-ink hover:bg-media-ink/15 hover:text-media-ink [&_svg]:size-5"
    >
      {children}
    </Button>
  );
}
