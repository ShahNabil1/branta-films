import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import logo from "@/assets/brand/branta-logo-light.png";

/**
 * DevToolsShield — same architecture as Branta Hub:
 *  - Blocks right-click, F12, Ctrl+Shift+I/J/C, Cmd+Opt+I/J/C, Ctrl+U, Ctrl+S.
 *  - Detects an open DevTools panel via `disable-devtool`, with a
 *    debugger-timing fallback loop.
 *  - Shows a full-screen blackout warning while DevTools is open.
 *  - Fully disabled on localhost, Lovable preview domains and inside iframes.
 *
 * This is friction, not a security boundary. Real protection lives in the
 * server: short-lived signed video links issued only after an access check.
 */

const WARNING_TEXT =
  "Developer tools are not allowed on Branta Films. Please close the panel to continue watching.";

export type DevToolsShieldConfig = {
  checkIntervalMs: number;
  debuggerThresholdMs: number;
  triggerSamples: number;
  clearSamples: number;
  usePackage: boolean;
  useDebuggerFallback: boolean;
  pauseWhenHidden: boolean;
  disabledHostSuffixes: string[];
  disableInIframe: boolean;
};

export const DEFAULT_DEVTOOLS_SHIELD_CONFIG: DevToolsShieldConfig = {
  checkIntervalMs: 1000,
  debuggerThresholdMs: 150,
  triggerSamples: 2,
  clearSamples: 2,
  usePackage: true,
  useDebuggerFallback: true,
  pauseWhenHidden: true,
  disabledHostSuffixes: [".lovableproject.com", ".lovable.app", ".lovable.dev", "localhost", "127.0.0.1"],
  disableInIframe: true,
};

export function isShieldDisabledHost(host: string, suffixes: string[]) {
  return suffixes.some((suffix) => (suffix.startsWith(".") ? host.endsWith(suffix) : host === suffix));
}

function Blackout() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.querySelectorAll("video").forEach((v) => v.pause());
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      ref={ref}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="shield-title"
      aria-describedby="shield-desc"
      tabIndex={-1}
      className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-background px-6 outline-none"
    >
      <div className="max-w-md text-center">
        <img src={logo} alt="Branta Tech" className="mx-auto h-8 w-auto" draggable={false} />
        <div className="mx-auto mt-8 flex size-14 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
          <AlertTriangle className="size-8 text-primary" />
        </div>
        <p className="mt-5 text-eyebrow text-muted-foreground">Branta Films · Security</p>
        <h1 id="shield-title" className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          Security Alert
        </h1>
        <p id="shield-desc" className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {WARNING_TEXT}
        </p>
      </div>
    </div>
  );
}

export function DevToolsShield({ children, config: userConfig }: { children: ReactNode; config?: Partial<DevToolsShieldConfig> }) {
  const config = { ...DEFAULT_DEVTOOLS_SHIELD_CONFIG, ...userConfig };
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);

  // Decide once, after hydration, whether this host is production.
  useEffect(() => {
    const host = window.location.hostname;
    const inIframe = window.self !== window.top;
    const disabled = (config.disableInIframe && inIframe) || isShieldDisabledHost(host, config.disabledHostSuffixes);
    setActive(!disabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shortcut + context-menu blocking (production only).
  useEffect(() => {
    if (!active) return;
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const lower = key.length === 1 ? key.toLowerCase() : key;
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      if (key === "F12") {
        e.preventDefault();
        return;
      }
      const inspect =
        (ctrlOrMeta && e.shiftKey && (lower === "i" || lower === "j" || lower === "c")) ||
        (e.metaKey && e.altKey && (lower === "i" || lower === "j" || lower === "c"));
      const viewSource = (e.ctrlKey && lower === "u") || (e.metaKey && e.altKey && lower === "u");
      const save = ctrlOrMeta && !e.shiftKey && !e.altKey && lower === "s";
      if (inspect || viewSource || save) e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown, { capture: true } as EventListenerOptions);
    };
  }, [active]);

  // DevTools detection (production only).
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let positive = 0;
    let negative = 0;
    let intervalId: number | undefined;

    const commit = (isOpen: boolean) => {
      if (cancelled) return;
      if (isOpen) {
        negative = 0;
        positive += 1;
        if (positive >= config.triggerSamples) setOpen(true);
      } else {
        positive = 0;
        negative += 1;
        if (negative >= config.clearSamples) setOpen(false);
      }
    };

    if (config.usePackage) {
      import("disable-devtool")
        .then((mod) => {
          if (cancelled) return;
          const dd = ((mod as { default?: unknown }).default ?? mod) as (opts: Record<string, unknown>) => void;
          try {
            dd({
              md5: "",
              url: "",
              tkName: "ddtk",
              ondevtoolopen: () => commit(true),
              ondevtoolclose: () => commit(false),
              interval: config.checkIntervalMs,
              disableMenu: true,
              clearIntervalWhenDevOpenTrigger: false,
              disableIframeParents: false,
            });
          } catch {
            /* fallback loop below still runs */
          }
        })
        .catch(() => undefined);
    }

    if (config.useDebuggerFallback) {
      intervalId = window.setInterval(() => {
        if (config.pauseWhenHidden && document.visibilityState === "hidden") return;
        const start = performance.now();
        // eslint-disable-next-line no-debugger
        debugger;
        commit(performance.now() - start > config.debuggerThresholdMs);
      }, config.checkIntervalMs);
    }

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <>
      <div aria-hidden={open || undefined} style={open ? { visibility: "hidden" } : undefined}>
        {children}
      </div>
      {open ? <Blackout /> : null}
    </>
  );
}
