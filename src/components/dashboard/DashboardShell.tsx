import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, Clapperboard, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand/Logo";
import { UserAvatar } from "@/components/site/UserMenu";
import { CartButton } from "@/components/commerce/CartSheet";
import { ConfirmDialog } from "@/components/ui/branded-dialog";
import { displayName, useAuth, useSignOut } from "@/lib/auth";
import { cn } from "@/lib/utils";

export type DashNavItem = {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};
export type DashNavSection = { title: string; items: DashNavItem[] };

const EASE = "duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none";

/**
 * Dashboard shell (viewer account and admin panel):
 * fixed dark sidebar (collapsible 288px ↔ 80px), titled collapsible sections, mobile drawer,
 * sticky pill switcher for the current section, light content canvas.
 */
export function DashboardShell({
  sections,
  storageKey,
  children,
}: {
  sections: DashNavSection[];
  /** Remembers collapsed sidebar + closed sections per dashboard. */
  storageKey: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, user } = useAuth();
  const signOut = useSignOut();
  const [askSignOut, setAskSignOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Dashboard routes render in the browser only, so reading storage here never mismatches.
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(`${storageKey}:collapsed`) === "1");
  const [closed, setClosed] = useState<string[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(`${storageKey}:closed`) ?? "[]");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  });

  useEffect(() => localStorage.setItem(`${storageKey}:collapsed`, collapsed ? "1" : "0"), [collapsed, storageKey]);
  useEffect(() => localStorage.setItem(`${storageKey}:closed`, JSON.stringify(closed)), [closed, storageKey]);
  useEffect(() => setMobileOpen(false), [pathname]);

  // Freeze the page behind the open mobile drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const isActive = (item: DashNavItem) =>
    item.exact ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(String(item.to));

  const activeSection = useMemo(
    () => sections.find((s) => s.items.some(isActive)) ?? sections[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname, sections],
  );

  // Always reveal the section holding the current page.
  useEffect(() => {
    if (activeSection) setClosed((c) => c.filter((t) => t !== activeSection.title));
  }, [activeSection]);

  const name = displayName(profile, user);

  const sidebar = (compact: boolean) => (
    <div className="relative flex h-full flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-32 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 bottom-24 size-56 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative flex min-h-24 items-center justify-center border-b border-border px-4">
        {compact ? (
          <Link to="/" aria-label="Branta Films home" className="rounded-xl">
            <img src="/favicon.png" alt="" className="size-10 rounded-xl" draggable={false} />
          </Link>
        ) : (
          <BrandLogo />
        )}
      </div>

      <nav aria-label="Dashboard" className="relative flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-8 pt-5">
        {sections.map((section) => {
          const open = compact || !closed.includes(section.title);
          return (
            <div key={section.title}>
              {!compact ? (
                <button
                  type="button"
                  onClick={() =>
                    setClosed((c) => (c.includes(section.title) ? c.filter((t) => t !== section.title) : [...c, section.title]))
                  }
                  aria-expanded={open}
                  className="text-eyebrow flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <span className="truncate">{section.title}</span>
                  <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", EASE, open ? "rotate-0" : "-rotate-90")} />
                </button>
              ) : null}
              <div className={cn("grid transition-[grid-template-rows,opacity]", EASE, open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <ul className="space-y-1.5 overflow-hidden pt-1.5">
                  {section.items.map((item) => {
                    const active = isActive(item);
                    return (
                      <li key={String(item.to)}>
                        <Link
                          to={item.to}
                          title={item.label}
                          preload="intent"
                          tabIndex={open ? 0 : -1}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group relative flex items-center gap-3.5 overflow-hidden rounded-xl px-3 py-3 text-[0.95rem] font-medium tracking-tight transition-[background-color,color,box-shadow] duration-200",
                            compact && "justify-center px-0",
                            active
                              ? "bg-foreground/10 text-foreground shadow-[var(--shadow-card)] ring-1 ring-inset ring-foreground/15"
                              : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                          )}
                        >
                          {active && !compact ? <span aria-hidden className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" /> : null}
                          <item.icon className={cn("size-[19px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                          {!compact ? <span className="min-w-0 truncate">{item.label}</span> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="relative space-y-1.5 border-t border-border px-4 py-4">
        {!compact ? (
          <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
            <UserAvatar size="size-9" />
            <div className="min-w-0">
              <p className="text-small truncate font-medium text-foreground">{name}</p>
              <p className="text-caption truncate text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        ) : null}
        <Link
          to="/"
          title="Back to Branta Films"
          className={cn(
            "flex items-center gap-3.5 rounded-xl px-3 py-3 text-[0.95rem] font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground",
            compact && "justify-center px-0",
          )}
        >
          <Clapperboard className="size-[19px] shrink-0" />
          {!compact ? <span className="truncate">Back to Main Site</span> : null}
        </Link>
        <button
          type="button"
          onClick={() => setAskSignOut(true)}
          title="Sign out"
          className={cn(
            "flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-[0.95rem] font-medium text-destructive transition-colors hover:bg-destructive/10",
            compact && "justify-center px-0",
          )}
        >
          <LogOut className="size-[19px] shrink-0" />
          {!compact ? <span className="truncate">Sign out</span> : null}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-background transition-[width] lg:block",
          EASE,
          collapsed ? "w-20" : "w-72",
        )}
      >
        {sidebar(collapsed)}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-[5.25rem] z-10 grid size-6 place-items-center rounded-full border border-border bg-surface text-muted-foreground shadow-[var(--shadow-card)] transition-[color,transform] duration-300 hover:scale-110 hover:text-primary"
        >
          <ChevronLeft className={cn("size-4 transition-transform duration-500", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl lg:hidden">
        <BrandLogo />
        <div className="flex items-center gap-1"><CartButton />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-foreground/10"
        >
          <Menu className="size-5" />
        </button></div>
      </header>

      {/* Mobile drawer */}
      <div
        aria-hidden
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-scrim backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-label="Dashboard menu"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] border-r border-border bg-background transition-transform lg:hidden",
          EASE,
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebar(false)}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </aside>

      {/* Content canvas */}
      <div className={cn("light min-h-svh bg-muted transition-[padding]", EASE, collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <div className="sticky top-14 z-20 border-b border-border bg-surface/85 backdrop-blur-md lg:top-0">
          <div className="no-scrollbar mx-auto flex h-14 w-full max-w-6xl items-center gap-2 overflow-x-auto px-4 lg:px-10">
            {(activeSection?.items ?? []).map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={String(item.to)}
                  to={item.to}
                  preload="intent"
                  className={cn(
                    "text-small inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 font-medium transition-[background-color,color] duration-300",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 lg:px-10 lg:py-10">{children}</main>
      </div>

      <ConfirmDialog
        open={askSignOut}
        onClose={() => setAskSignOut(false)}
        onConfirm={() => {
          setAskSignOut(false);
          void signOut();
        }}
        title="Sign out of Branta Films?"
        description="You'll need to sign in again to keep watching and manage your account."
        confirmLabel="Sign out"
        destructive
      />
    </div>
  );
}
