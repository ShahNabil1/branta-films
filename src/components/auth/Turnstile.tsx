import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

/** Public Cloudflare Turnstile site key (safe to ship; the secret lives in Supabase Attack Protection). */
export const TURNSTILE_SITE_KEY = "0x4AAAAAACNbiRh7P7qtgkXG";
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: TurnstileApi } }

let loader: Promise<TurnstileApi> | null = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loader ??= new Promise<TurnstileApi>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT; s.async = true; s.defer = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile unavailable")));
    s.onerror = () => { loader = null; reject(new Error("Turnstile failed to load")); };
    document.head.appendChild(s);
  });
  return loader;
}

export type TurnstileHandle = { reset: () => void };

/**
 * Security check shown on auth forms. Tokens are single-use: call `reset()`
 * after every submit so the next attempt gets a fresh one.
 */
export const Turnstile = forwardRef<TurnstileHandle, { onToken: (token: string | null) => void; action?: string }>(function Turnstile({ onToken, action }, ref) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const cb = useRef(onToken);
  cb.current = onToken;
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useImperativeHandle(ref, () => ({ reset: () => { cb.current(null); if (widget.current) window.turnstile?.reset(widget.current); } }), []);

  useEffect(() => {
    let alive = true;
    loadTurnstile().then((t) => {
      if (!alive || !box.current) return;
      widget.current = t.render(box.current, {
        sitekey: TURNSTILE_SITE_KEY, action, theme: "light", size: "flexible", appearance: "always",
        callback: (token: string) => cb.current(token),
        "expired-callback": () => cb.current(null),
        "error-callback": () => { cb.current(null); setState("error"); },
      });
      setState("ready");
    }).catch(() => alive && setState("error"));
    return () => { alive = false; if (widget.current) window.turnstile?.remove(widget.current); widget.current = null; };
  }, [action]);

  return <div className="space-y-2">
    <div ref={box} className="min-h-[65px] w-full overflow-hidden rounded-xl" aria-label="Security check" />
    {state === "loading" ? <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 animate-pulse text-primary" />Loading security check…</p> : null}
    {state === "error" ? <p className="text-xs text-destructive">The security check couldn't load. Check your connection and refresh the page.</p> : null}
  </div>;
});
