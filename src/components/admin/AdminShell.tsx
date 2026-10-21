import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ChevronDown, ArrowUpRight, LogOut, Menu, X } from "lucide-react";
import type { DashNavSection, DashNavItem } from "@/components/dashboard/DashboardShell";
import { BrandLogo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/branded-dialog";
import { useAuth, useSignOut, displayName } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function AdminShell({ sections, children }: { sections: DashNavSection[]; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile } = useAuth();
  const signOut = useSignOut();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [closed, setClosed] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { try { setCollapsed(localStorage.getItem("bf-admin-nav:collapsed") === "1"); } catch {} }, []);
  const active = (item: DashNavItem) => item.exact ? path === item.to || path === `${item.to}/` : path.startsWith(String(item.to));
  const section = sections.find((s) => s.items.some(active)) ?? sections[0];
  const current = section?.items.find(active);
  useEffect(() => { setMobile(false); }, [path]);
  useEffect(() => { if (!mobile) return; const before = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = before; }; }, [mobile]);
  function collapse() { setCollapsed((previous) => { try { localStorage.setItem("bf-admin-nav:collapsed", previous ? "0" : "1"); } catch {} return !previous; }); }
  const navigation = (compact: boolean) => <div className="flex h-full flex-col">
    <div className="flex h-24 shrink-0 items-center justify-between border-b border-border px-5">{compact ? <Link to="/" aria-label="Branta Films"><img src="/favicon.png" className="size-9" alt="" /></Link> : <div><BrandLogo /><p className="mt-2 text-xs text-muted-foreground">Administration</p></div>}{!compact ? <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Close menu" onClick={() => setMobile(false)}><X /></Button> : null}</div>
    <nav aria-label="Administration" className="flex-1 space-y-5 overflow-y-auto p-3 pt-6">{sections.map((group) => <div key={group.title}>{!compact ? <Button variant="ghost" onClick={() => setClosed((v) => v.includes(group.title) ? v.filter((s) => s !== group.title) : [...v, group.title])} aria-expanded={!closed.includes(group.title)} className="mb-2 h-8 w-full justify-between px-3 text-xs text-muted-foreground">{group.title}<ChevronDown className={cn("size-3.5", closed.includes(group.title) && "-rotate-90")} /></Button> : null}{compact || !closed.includes(group.title) ? <div className="space-y-1">{group.items.map((item) => <Button key={String(item.to)} asChild variant="ghost" className={cn("admin-nav-link h-12 w-full justify-start gap-3 rounded-lg px-3", compact && "justify-center px-0", active(item) && "admin-nav-active")}><Link to={item.to} title={item.label} aria-current={active(item) ? "page" : undefined}><item.icon className="size-[19px] shrink-0" />{!compact ? <span className="truncate">{item.label}</span> : null}</Link></Button>)}</div> : null}</div>)}</nav>
    <div className="space-y-2 border-t border-border p-3">{!compact ? <div className="flex items-center gap-3 px-3 py-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 font-semibold text-primary">{displayName(profile, user).slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{displayName(profile, user)}</p><p className="truncate text-xs text-muted-foreground">{user?.email ?? "Administrator"}</p></div></div> : null}<Button asChild variant="ghost" className={cn("h-10 w-full justify-start gap-3 text-muted-foreground", compact && "justify-center px-0")}><Link to="/" title="View website"><ArrowUpRight className="size-4" />{!compact ? "View website" : null}</Link></Button><Button variant="ghost" title="Sign out" onClick={() => setConfirm(true)} className={cn("h-10 w-full justify-start gap-3 text-destructive", compact && "justify-center px-0")}><LogOut className="size-4" />{!compact ? "Sign out" : null}</Button></div>
  </div>;
  return <div className="admin-theme light min-h-svh bg-muted text-foreground">
    <aside className={cn("admin-sidebar fixed inset-y-0 left-0 z-40 hidden border-r border-border transition-[width] duration-200 motion-reduce:transition-none lg:block", collapsed ? "w-20" : "w-72")}>{navigation(collapsed)}<Button size="icon" variant="outline" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={collapse} className="absolute -right-3 top-20 size-6 rounded-full bg-surface"><ChevronLeft className={cn("size-3.5", collapsed && "rotate-180")} /></Button></aside>
    {mobile ? <><div className="fixed inset-0 z-40 bg-scrim lg:hidden" /><aside className="admin-sidebar fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] lg:hidden">{navigation(false)}</aside></> : null}
    <div className={cn("min-w-0 transition-[padding] duration-200 motion-reduce:transition-none", collapsed ? "lg:pl-20" : "lg:pl-72")}>
      <header className="sticky top-0 z-30 border-b border-border bg-surface"><div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-8"><div className="flex min-w-0 items-center gap-3"><Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open menu" onClick={() => setMobile(true)}><Menu /></Button><span className="hidden text-sm text-muted-foreground sm:inline">Branta Films</span><span className="hidden text-muted-foreground sm:inline">/</span><span className="truncate text-sm font-medium">{current?.label ?? "Administration"}</span></div><Button asChild variant="outline" size="sm"><Link to="/"><ArrowUpRight className="size-4" /><span className="hidden sm:inline">View website</span></Link></Button></div><div className="no-scrollbar flex h-12 items-center gap-1 overflow-x-auto border-t border-border px-4 lg:px-8">{section?.items.map((item) => <Button asChild key={String(item.to)} variant="ghost" size="sm" className={cn("shrink-0 rounded-lg", active(item) ? "bg-primary/10 text-accent-foreground" : "text-muted-foreground")}><Link to={item.to}><item.icon className="size-4" />{item.label}</Link></Button>)}</div></header>
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div><ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Sign out of Branta Films?" description="You will need to sign in again to manage your account." confirmLabel="Sign out" onConfirm={() => { setConfirm(false); void signOut(); }} />
  </div>;
}