import { Link } from "@tanstack/react-router";
import { SiteContainer } from "@/components/layout/primitives";

/** Shared footer: legal row and the Branta wordmark only. */
export function SiteFooter() {
  return (
    <footer className="footer-glow relative overflow-hidden border-t border-border text-foreground">
      <SiteContainer wide>
        <div className="flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
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
