import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; eyebrow?: string; icon?: LucideIcon; action?: ReactNode }) {
  return <header className="flex flex-wrap items-center justify-between gap-4 py-1"><div className="min-w-0"><h1 className="text-2xl font-semibold text-foreground">{title}</h1>{description ? <p className="mt-1.5 text-sm text-muted-foreground">{description}</p> : null}</div>{action}</header>;
}
export function Panel({ title, description, action, children, className, ...props }: Omit<ComponentPropsWithoutRef<"section">, "title"> & { title?: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return <section className={cn("admin-panel", className)} {...props}>{title || action ? <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">{title}</h2>{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}</div>{action}</div> : null}{children}</section>;
}
export function StatTile({ to, icon: Icon, label, value, hint, tone = "brand" }: { to: NonNullable<LinkProps["to"]>; icon: LucideIcon; label: string; value: ReactNode; hint?: string; tone?: "brand" | "success" | "neutral" }) {
  return <Link to={to} className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/40"><div className="flex items-start justify-between"><span className={cn("grid size-9 place-items-center rounded-lg", tone === "success" ? "bg-success/10 text-success" : tone === "neutral" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}><Icon className="size-[18px]" /></span><ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary" /></div><p className="mt-4 text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>{hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}</Link>;
}
export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" | "success" }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize", tone === "success" ? "bg-success/10 text-success" : tone === "brand" ? "bg-primary/10 text-accent-foreground" : "bg-muted text-muted-foreground")}><span className="size-1.5 rounded-full bg-current" />{children}</span>;
}