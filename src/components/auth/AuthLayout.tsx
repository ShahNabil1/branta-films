import type { ReactNode } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { Eyebrow, SiteContainer } from "@/components/layout/primitives";

/**
 * Branta Tech sign-in layout: site header on top, one calm centred column on a light section,
 * a bordered card for the form, and the site footer below.
 */
export function AuthLayout({
  eyebrow = "Branta Films account",
  title,
  subtitle,
  footer,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SiteShell>
      <section className="light bg-background py-16 md:py-24">
        <SiteContainer>
          <div className="mx-auto w-full max-w-md animate-rise">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="text-h1 mt-3 text-foreground">{title}</h1>
            {subtitle ? <p className="text-body mt-3 text-muted-foreground">{subtitle}</p> : null}
            <div className="mt-8 rounded-md border border-border bg-surface p-6 md:p-8">{children}</div>
            {footer ? <div className="text-small mt-6 text-muted-foreground">{footer}</div> : null}
          </div>
        </SiteContainer>
      </section>
    </SiteShell>
  );
}

export function OrDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="text-caption my-6 flex items-center gap-3 text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Underlined text link used under auth cards. */
export const authLinkCls =
  "font-medium text-foreground underline decoration-border decoration-1 underline-offset-[6px] transition-colors hover:decoration-primary";

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.93l-3.88-3c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.27a7.2 7.2 0 0 1 0-4.54V6.64H1.28a12 12 0 0 0 0 10.72l4.01-3.09Z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.17 15.23 0 12 0A12 12 0 0 0 1.28 6.64l4.01 3.09C6.23 6.86 8.88 4.75 12 4.75Z" />
    </svg>
  );
}

export function FormAlert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "text-small rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive"
          : "text-small rounded-sm border border-border bg-muted px-3 py-2 text-foreground"
      }
    >
      {children}
    </p>
  );
}
