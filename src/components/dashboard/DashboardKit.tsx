import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Eyebrow } from "@/components/layout/primitives";
import { cn } from "@/lib/utils";

/** Module header card: orange top bar, soft orange wash, icon chip, title, description and an action slot. */
export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "animate-rise relative overflow-hidden rounded-2xl border border-primary/20 bg-surface p-5 sm:p-7",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-primary/[0.03] to-transparent" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {Icon ? (
            <span className="mt-0.5 inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Icon className="size-5" aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            <h1 className={cn("text-h3 font-semibold text-foreground", eyebrow && "mt-2.5")}>{title}</h1>
            {description ? <p className="text-small mt-2 max-w-2xl text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

/** White content panel used for every dashboard section. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  delay = 0,
  ...props
}: Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  delay?: number;
}) {
  return (
    <section
      className={cn("animate-rise rounded-2xl border border-border bg-surface p-5 sm:p-7", className)}
      style={{ ["--rise-delay" as string]: `${delay}ms` }}
      {...props}
    >
      {title || action ? (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h2 className="text-h4 font-semibold text-foreground">{title}</h2> : null}
            {description ? <p className="text-small mt-1.5 max-w-2xl text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Clickable shortcut tile with an icon chip, label and value. */
export function StatTile({
  to,
  icon: Icon,
  label,
  value,
  hint,
  delay = 0,
  compactMobile = false,
}: {
  to: NonNullable<LinkProps["to"]>;
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  delay?: number;
  compactMobile?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn("animate-rise group relative flex rounded-2xl border border-border bg-surface transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card)]", compactMobile ? "min-h-16 flex-row items-center gap-2 rounded-lg px-3 py-3 sm:flex-col sm:items-stretch sm:gap-0 sm:rounded-2xl sm:p-5" : "flex-col p-5")}
      style={{ ["--rise-delay" as string]: `${delay}ms` }}
    >
      <div className={cn("flex items-center justify-between", compactMobile && "shrink-0")}>
        <span className={cn("inline-flex items-center justify-center bg-primary/10 text-primary ring-1 ring-primary/20", compactMobile ? "size-7 rounded-lg sm:size-10 sm:rounded-xl" : "size-10 rounded-xl")}>
          <Icon className={compactMobile ? "size-3.5 sm:size-[18px]" : "size-[18px]"} aria-hidden />
        </span>
        <ArrowUpRight aria-hidden className={cn("size-4 text-muted-foreground transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary", compactMobile && "hidden sm:block")} />
      </div>
      <p className={compactMobile ? "min-w-0 flex-1 text-xs leading-4 text-muted-foreground sm:mt-5 sm:flex-none sm:text-sm" : "text-small mt-5 text-muted-foreground"}>{label}</p>
      <p className={compactMobile ? "shrink-0 text-lg font-semibold tabular-nums text-foreground sm:mt-1 sm:text-3xl" : "text-h3 mt-1 font-semibold text-foreground"}>{value}</p>
      {hint ? <p className="text-caption mt-1 text-muted-foreground">{hint}</p> : null}
    </Link>
  );
}

/** Small pill showing a status or a connected method. */
export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" | "success" }) {
  return (
    <span
      className={cn(
        "text-small inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 font-medium",
        tone === "brand" && "border-primary/30 bg-primary/10 text-accent-foreground",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "neutral" && "border-border bg-muted text-foreground",
      )}
    >
      {children}
    </span>
  );
}
