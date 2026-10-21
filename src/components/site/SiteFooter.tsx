import { Link } from "@tanstack/react-router";
import logo from "@/assets/brand/branta-logo-light.png";

const linkClass = "text-foreground/75 transition-colors hover:text-primary";

export function SiteFooter() {
  return (
    <footer className="footer-glow relative overflow-hidden border-t border-foreground/10">
      <div className="hairline-glow absolute inset-x-0 top-0 h-px" aria-hidden="true" />
      <div className="mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] py-12 md:py-16">
        <div className="glass grid gap-10 rounded-2xl p-8 md:grid-cols-[2fr_1fr_1fr] md:p-10">
          <div>
            <img src={logo} alt="Branta Tech" width={1288} height={308} className="h-7 w-auto" loading="lazy" />
            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
              Branta Films is the premium streaming home for original series by Branta Tech. Episode one is always on us.
            </p>
          </div>
          <div>
            <p className="text-eyebrow text-primary">Watch</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/browse" className={linkClass}>
                  Browse series
                </Link>
              </li>
              <li>
                <Link to="/account" className={linkClass}>
                  Continue watching
                </Link>
              </li>
              <li>
                <Link to="/account/library" className={linkClass}>
                  My library
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-eyebrow text-primary">Legal</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/privacy" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className={linkClass}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="mailto:hello@brantatech.com" className={linkClass}>
                  hello@brantatech.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 px-1 font-mono text-xs text-muted-foreground">
          <span>© 2026 Branta Tech. All rights reserved.</span>
          <span>films.brantatech.com</span>
        </div>
      </div>
    </footer>
  );
}
