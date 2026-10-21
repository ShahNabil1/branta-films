import { Link } from "@tanstack/react-router";
import logo from "@/assets/brand/branta-logo-light.png";

export function SiteFooter() {
  return (
    <footer className="footer-glow border-t border-border">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-[clamp(1.25rem,4vw,3rem)] py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <img src={logo} alt="Branta Tech" width={1288} height={308} className="h-7 w-auto" loading="lazy" />
          <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
            Branta Films is the premium streaming home for original series by Branta Tech.
          </p>
        </div>
        <div>
          <p className="text-eyebrow text-muted-foreground">Watch</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/browse" className="text-foreground/80 transition-colors hover:text-primary">
                Browse series
              </Link>
            </li>
            <li>
              <Link to="/account" className="text-foreground/80 transition-colors hover:text-primary">
                Continue watching
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-eyebrow text-muted-foreground">Legal</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/privacy" className="text-foreground/80 transition-colors hover:text-primary">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="text-foreground/80 transition-colors hover:text-primary">
                Terms of Service
              </Link>
            </li>
            <li>
              <a href="mailto:hello@brantatech.com" className="text-foreground/80 transition-colors hover:text-primary">
                hello@brantatech.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-[clamp(1.25rem,4vw,3rem)] py-5 font-mono text-xs text-muted-foreground">
          <span>© 2026 Branta Tech. All rights reserved.</span>
          <span>films.brantatech.com</span>
        </div>
      </div>
    </footer>
  );
}
