import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** Page header card with gradient accent bar; with `back` it centres the title. */
export function PageHeader({ title, description, action, back }: { title: ReactNode; description?: ReactNode; eyebrow?: string; icon?: LucideIcon; action?: ReactNode; back?: { to: NonNullable<LinkProps["to"]>; label?: string } }) {
  if (back) return (
    <header className="admin-rise flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-5">
      <Link to={back.to} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-accent"><ArrowLeft className="size-4" />{back.label ?? "Back"}</Link>
      <div className="min-w-0 flex-1 text-center"><h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}</div>
      <div className="shrink-0">{action}</div>
    </header>
  );
  return (
    <header className="admin-rise flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="relative min-w-0 pl-4"><span className="admin-gradient absolute left-0 top-1 h-[calc(100%-0.5rem)] w-1 rounded-full" /><h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}</div>
      {action}
    </header>
  );
}

export function Panel({ title, description, action, children, className, ...props }: Omit<ComponentPropsWithoutRef<"section">, "title"> & { title?: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return <section className={cn("admin-panel", className)} {...props}>{title || action ? <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold">{title}</h2>{description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}</div>{action}</div> : null}{children}</section>;
}

export function StatTile({ to, icon: Icon, label, value, hint }: { to: NonNullable<LinkProps["to"]>; icon: LucideIcon; label: string; value: ReactNode; hint?: string; tone?: "brand" | "success" | "neutral" }) {
  return <Link to={to} className="admin-rise group rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
    <span className="grid size-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary"><Icon className="size-4" /></span>
    <p className="mt-4 text-xs text-muted-foreground">{label}</p><p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>{hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
  </Link>;
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" | "success" }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 transition-transform duration-200 hover:scale-105", tone === "success" ? "bg-success/10 text-success ring-success/25" : tone === "brand" ? "bg-primary/10 text-accent-foreground ring-primary/25" : "bg-muted text-muted-foreground ring-border")}>{children}</span>;
}

/** Uppercase label that turns orange while its control has focus. */
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return <label className={cn("group/field block space-y-1.5", className)}><span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors group-focus-within/field:text-primary">{label}</span>{children}{hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}</label>;
}

export function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-300", checked ? "admin-gradient-soft border-primary/40" : "border-border bg-background/60 hover:border-primary/30")}><span className="text-sm font-medium">{label}</span><Switch checked={checked} onCheckedChange={onChange} /></label>;
}

const actionBase = "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5";
export const editActionClass = `${actionBase} bg-primary/10 text-accent-foreground ring-primary/25 hover:bg-primary hover:text-primary-foreground hover:shadow-primary/25`;
export const deleteActionClass = `${actionBase} bg-destructive/10 text-destructive ring-destructive/25 hover:bg-destructive hover:text-destructive-foreground hover:shadow-destructive/25`;
export const moveActionClass = "grid size-8 place-items-center rounded-full bg-muted text-muted-foreground ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:bg-card hover:text-primary hover:ring-primary/30 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4";
