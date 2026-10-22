import { Link, useLocation } from "@tanstack/react-router";
import { Eyebrow, SiteContainer } from "@/components/layout/primitives";

const linkCls = "footer-link text-small text-foreground/70 transition-colors hover:text-foreground";
const COLUMNS = [
  { title: "Watch", links: [{ to: "/", label: "Home" }, { to: "/browse", label: "Browse series" }] },
  { title: "Account", links: [{ to: "/account", label: "My dashboard" }, { to: "/account/library", label: "My library" }, { to: "/account/security", label: "Sign-in & security" }] },
  { title: "Legal", links: [{ to: "/privacy", label: "Privacy Policy" }, { to: "/terms", label: "Terms of Service" }] },
] as const;

/** Full shared footer, with only the legal row and wordmark on /auth. */
export function SiteFooter() {
  const compact = useLocation({ select: location => location.pathname.replace(/\/$/, "") === "/auth" });
  return (
    <footer className="footer-glow relative overflow-hidden border-t border-border text-foreground">
      <SiteContainer wide className={compact ? undefined : "pt-20 md:pt-28"}>
        {!compact ? <>
          <div className="grid gap-10 border-b border-border pb-16 md:pb-24 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <Eyebrow className="text-foreground/60">Start watching</Eyebrow>
              <h2 className="text-display mt-6 max-w-[16ch] font-medium">AI-generated stories. A new world to watch.</h2>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-4 lg:col-span-4 lg:justify-end">
              <Link to="/browse" className="footer-cta group text-h4 inline-flex items-center gap-2 pb-1 font-medium">
                Browse series <span aria-hidden className="transition-transform duration-300">→</span>
              </Link>
              <Link to="/auth" search={{ mode: "signup" }} className="footer-cta group text-h4 inline-flex items-center gap-2 pb-1 font-medium">
                Create account <span aria-hidden className="transition-transform duration-300">→</span>
              </Link>
            </div>
          </div>
          <div className="grid gap-12 py-16 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-h4 font-medium">AI-generated series by Branta Tech.</p>
              <p className="text-body mt-4 max-w-xs text-foreground/65">The OTT home of Branta Tech’s curated AI-generated web series from Bangladesh.</p>
              <address className="text-small mt-8 grid gap-2 not-italic">
                <a href="mailto:hello@brantatech.com" className={`${linkCls} w-fit`}>hello@brantatech.com</a>
                <a href="https://brantatech.com" target="_blank" rel="noreferrer" className={`${linkCls} w-fit`}>brantatech.com</a>
              </address>
            </div>
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-8">
              {COLUMNS.map(column => <div key={column.title}>
                <p className="text-eyebrow text-foreground">{column.title}</p>
                <ul className="mt-5 grid gap-3">
                  {column.links.map(link => <li key={link.to}><Link to={link.to} className={linkCls}>{link.label}</Link></li>)}
                </ul>
              </div>)}
            </nav>
          </div>
        </> : null}
        <div className={`flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between${compact ? "" : " border-t border-border"}`}>
          <p className="text-caption text-foreground/55">© 2026 Branta Tech. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="footer-link text-caption text-foreground/70 transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link to="/terms" className="footer-link text-caption text-foreground/70 transition-colors hover:text-primary">
              Terms
            </Link>
          </div>
        </div>

        <div aria-hidden className="overflow-hidden">
          <p className="footer-wordmark select-none text-center font-semibold leading-[0.78] tracking-[-0.06em] text-foreground">
            Branta
          </p>
        </div>
      </SiteContainer>
    </footer>
  );
}
