import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Page-width container (Branta Tech gutters). */
export function SiteContainer({
  className,
  wide,
  ...props
}: ComponentPropsWithoutRef<"div"> & { wide?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-[var(--gutter)]",
        wide ? "max-w-[var(--page-max)]" : "max-w-[calc(var(--content-max)+2*var(--gutter))]",
        className,
      )}
      {...props}
    />
  );
}

/** Mono uppercase label with the small orange dot — the Branta Tech signature. */
export function Eyebrow({ className, children, ...props }: ComponentPropsWithoutRef<"p">) {
  return (
    <p className={cn("text-eyebrow flex items-center gap-2 text-muted-foreground", className)} {...props}>
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />
      {children}
    </p>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  intro,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("grid gap-6 lg:grid-cols-12 lg:items-end", className)}>
      <div className="lg:col-span-8">
        {eyebrow ? <Eyebrow className="mb-5">{eyebrow}</Eyebrow> : null}
        <h2 className="text-h2">{title}</h2>
      </div>
      {intro ? <p className="text-body-lg text-muted-foreground lg:col-span-4">{intro}</p> : null}
    </header>
  );
}
