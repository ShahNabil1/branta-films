import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ExternalLink, LogOut, Menu, X } from "lucide-react";
import type { DashNavSection, DashNavItem } from "@/components/dashboard/DashboardShell";
import { BrandLogo } from "@/components/brand/Logo";
import { ConfirmDialog } from "@/components/ui/branded-dialog";
import { useSignOut } from "@/lib/auth";
import { cn } from "@/lib/utils";

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

export function AdminShell({ sections, children }: { sections: DashNavSection[]; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const signOut = useSignOut();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState<string[]>(() => sections.map((s) => s.title));
  const [confirm, setConfirm] = useState(false);

  const isActive = (item: DashNavItem) => (item.exact ? path === item.to || path === `${item.to}/` : path.startsWith(String(item.to)));
  const activeSection = useMemo(() => sections.find((s) => s.items.some(isActive))?.title ?? sections[0]?.title, [path, sections]);
  const topItems = sections.find((s) => s.title === activeSection)?.items ?? [];

  useEffect(() => {
    try {
      if (localStorage.getItem("bf-admin-nav:collapsed") === "1") setCollapsed(true);
      const saved = JSON.parse(localStorage.getItem("bf-admin-nav:sections") ?? "null");
      if (Array.isArray(saved)) setOpen(saved);
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("bf-admin-nav:collapsed", collapsed ? "1" : "0"); } catch {} }, [collapsed]);
  useEffect(() => { try { localStorage.setItem("bf-admin-nav:sections", JSON.stringify(open)); } catch {} }, [open]);
  useEffect(() => { if (activeSection) setOpen((p) => (p.includes(activeSection) ? p : [...p, activeSection])); }, [activeSection]);
  useEffect(() => { setMobile(false); }, [path]);
  useEffect(() => {
    if (!mobile) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = before; };
  }, [mobile]);
  // Warm every admin page once idle so navigation feels instant.
  useEffect(() => {
    const warm = () => sections.forEach((s) => s.items.forEach((i) => void router.preloadRoute({ to: i.to as "/admin" }).catch(() => undefined)));
    const id = globalThis.setTimeout(warm, 400);
    return () => globalThis.clearTimeout(id);
  }, [router, sections]);

  const toggle = (title: string, el: HTMLElement | null) => {
    const opening = !open.includes(title);
    setOpen((p) => (p.includes(title) ? p.filter((t) => t !== title) : [...p, title]));
    if (opening && el) for (const d of [200, 450, 700]) globalThis.setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "nearest" }), d);
  };

  const sidebar = (compact: boolean) => (
    <div className="relative flex h-full flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 -top-32 size-64 rounded-full bg-foreground/[0.03] blur-3xl" />
        <div className="absolute -right-16 top-1/3 size-48 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="relative flex min-h-28 items-center justify-center border-b border-border px-4 py-6">
        <Link to="/admin" title="Branta Films" className="shrink-0 transition-all duration-300">
          {compact ? <img src="/favicon.png" alt="Branta Films" className="size-12 rounded-xl object-contain p-1 ring-1 ring-border" /> : <span className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 ring-1 ring-border"><BrandLogo /></span>}
        </Link>
      </div>
      <nav aria-label="Administration" className="relative flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-8 pt-5">
        {sections.map((section) => {
          const expanded = compact || open.includes(section.title);
          const hasActive = section.items.some(isActive);
          return (
            <div key={section.title} data-section={section.title}>
              <div className={cn("grid transition-[grid-template-rows,opacity] duration-[600ms] motion-reduce:transition-none", EASE, compact ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100")}>
                <div className="overflow-hidden">
                  <button type="button" tabIndex={compact ? -1 : 0} aria-expanded={expanded} onClick={(e) => toggle(section.title, e.currentTarget.closest("div[data-section]"))}
                    className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors duration-300 hover:bg-accent hover:text-foreground", hasActive ? "text-foreground/90" : "text-muted-foreground")}>
                    <span className="truncate">{section.title}</span>
                    <ChevronDown className={cn("size-3.5 shrink-0 transition-transform duration-[600ms]", EASE, expanded ? "rotate-0" : "-rotate-90")} />
                  </button>
                </div>
              </div>
              <div className={cn("grid transition-[grid-template-rows,opacity,filter] duration-[600ms] motion-reduce:transition-none", EASE, expanded ? "grid-rows-[1fr] opacity-100 blur-0" : "grid-rows-[0fr] opacity-0 blur-[2px]")}>
                <div className="overflow-hidden">
                  <ul className={cn("space-y-1.5", compact ? "pt-0" : "pt-1.5")}>
                    {section.items.map((item) => {
                      const active = isActive(item);
                      return (
                        <li key={String(item.to)}>
                          <Link to={item.to} title={item.label} preload="intent" tabIndex={expanded ? 0 : -1} aria-current={active ? "page" : undefined}
                            className={cn("group relative flex items-center gap-3.5 overflow-hidden rounded-xl px-3 py-3 text-[0.95rem] font-semibold tracking-tight transition-all duration-200", compact && "justify-center px-0",
                              active ? "bg-foreground/10 text-foreground shadow-lg shadow-background/30 ring-1 ring-inset ring-foreground/15 backdrop-blur-xl" : "text-foreground/75 hover:bg-accent hover:text-foreground")}>
                            {active && !compact ? <span className="admin-gradient absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" /> : null}
                            <item.icon className={cn("size-[19px] shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                            <span className={cn("min-w-0 truncate whitespace-nowrap transition-all duration-200", compact ? "w-0 opacity-0" : "w-auto opacity-100")}>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
      <div className="relative space-y-1.5 border-t border-border px-4 py-4">
        <Link to="/" title="Go to main website" className={cn("flex items-center gap-3.5 rounded-xl px-3 py-3 text-[0.95rem] font-semibold text-foreground/75 transition-colors hover:bg-accent hover:text-foreground", compact && "justify-center px-0")}>
          <ExternalLink className="size-[19px] shrink-0 text-muted-foreground" />{!compact ? <span className="truncate">Go to main website</span> : null}
        </Link>
        <button type="button" onClick={() => setConfirm(true)} title="Sign out" className={cn("flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-[0.95rem] font-semibold text-destructive transition-colors hover:bg-destructive/10", compact && "justify-center px-0")}>
          <LogOut className="size-[19px] shrink-0" />{!compact ? <span className="truncate">Sign out</span> : null}
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-theme light min-h-svh bg-background text-foreground">
      <aside className={cn("admin-sidebar fixed inset-y-0 left-0 z-40 hidden shadow-2xl shadow-background/40 transition-[width] duration-[600ms] motion-reduce:transition-none lg:block", EASE, collapsed ? "w-20" : "w-72")}>
        {sidebar(collapsed)}
        <button type="button" onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="light absolute -right-3 top-24 z-10 grid size-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow transition-all duration-300 hover:scale-110 hover:text-primary">
          <ChevronLeft className={cn("size-4 transition-transform duration-500", collapsed && "rotate-180")} />
        </button>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2"><img src="/favicon.png" alt="" className="size-8 rounded-lg object-contain" /><span className="text-base font-bold tracking-tight">Branta Films</span></div>
        <button type="button" onClick={() => setMobile(true)} aria-label="Open menu" className="grid size-9 place-items-center rounded-lg transition-transform duration-150 hover:bg-accent active:scale-95"><Menu className="size-5" /></button>
      </header>

      <div onClick={() => setMobile(false)} className={cn("fixed inset-0 z-40 bg-scrim backdrop-blur-sm transition-opacity duration-300 lg:hidden", mobile ? "opacity-100" : "pointer-events-none opacity-0")} />
      <aside className={cn("admin-sidebar fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] transition-transform duration-[600ms] lg:hidden", EASE, mobile ? "translate-x-0" : "-translate-x-full")}>
        {sidebar(false)}
        <button type="button" onClick={() => setMobile(false)} aria-label="Close menu" className="absolute right-2 top-4 z-10 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-4" /></button>
      </aside>

      <div className={cn("transition-[padding] duration-[600ms] motion-reduce:transition-none", EASE, collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <div className="sticky top-0 z-20 border-b border-border bg-card/85 backdrop-blur-md">
          <div className="no-scrollbar mx-auto flex h-[53px] w-full max-w-6xl items-center gap-2 overflow-x-auto px-4 lg:px-10">
            {topItems.map((item) => {
              const active = isActive(item);
              return (
                <Link key={String(item.to)} to={item.to} preload="intent"
                  className={cn("inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-300", EASE, active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
                  <item.icon className="size-4" />{item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <main key={path} className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 lg:px-10 lg:py-10">{children}</main>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Sign out of the admin panel?" description="You'll need to sign in again to manage series, episodes and staff." confirmLabel="Sign out" onConfirm={() => { setConfirm(false); void signOut(); }} />
    </div>
  );
}
