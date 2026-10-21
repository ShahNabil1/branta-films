import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand/Logo";
import backdrop from "@/assets/auth-backdrop.webp";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className="relative isolate hidden flex-col justify-between overflow-hidden border-r border-border p-12 lg:flex">
        <img src={backdrop} alt="" width={1600} height={900} className="absolute inset-0 -z-20 size-full object-cover opacity-50" />
        <div className="hero-fade absolute inset-0 -z-10" />
        <BrandLogo />
        <div className="max-w-xl">
          <p className="text-eyebrow text-primary">Branta Films</p>
          <h1 className="mt-5 text-display">
            Stories made
            <br />
            to be <span className="text-primary">watched.</span>
          </h1>
          <p className="mt-6 max-w-sm text-muted-foreground">Original series by Branta Tech. Start free with episode one.</p>
        </div>
        <Link to="/" className="group inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Back to Branta Films
        </Link>
      </section>
      <section className="flex min-w-0 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLogo />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <footer className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>© 2026 Branta Tech</span>
            <Link to="/privacy" className="hover:text-primary">Privacy</Link>
            <Link to="/terms" className="hover:text-primary">Terms</Link>
          </footer>
        </div>
      </section>
    </main>
  );
}

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
    <div
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-sm leading-6 text-destructive"
          : "rounded-sm border border-success/30 bg-success/10 p-3 text-sm leading-6 text-success"
      }
    >
      {children}
    </div>
  );
}
