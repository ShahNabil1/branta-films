import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { BrandLogo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse" },
] as const;

/**
 * Over a cinematic hero the bar starts transparent (soft top fade only) and turns into frosted glass
 * once the page scrolls. Everywhere else it is glass from the start.
 */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const clear = overlay && !scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-16 border-b transition-[background-color,border-color,backdrop-filter] duration-500",
        clear
          ? "border-transparent bg-linear-to-b from-background/80 to-transparent"
          : "border-foreground/10 bg-background/65 backdrop-blur-xl backdrop-saturate-150",
        overlay && "-mb-16",
      )}
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-3 px-[clamp(1rem,4vw,3rem)] sm:gap-6 md:gap-10">
        <BrandLogo />
        <nav aria-label="Main" className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="relative rounded-sm px-2 py-2 text-sm sm:px-3 text-foreground/70 transition-colors after:absolute after:inset-x-2 after:bottom-0.5 sm:after:inset-x-3 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 hover:text-foreground data-[status=active]:font-medium data-[status=active]:text-foreground data-[status=active]:after:scale-x-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center justify-end gap-1 sm:gap-2">
          <Link
            to="/browse"
            aria-label="Search series"
            className="grid size-9 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <Search className="size-[18px]" />
          </Link>
          <div className="flex min-w-9 justify-end">
            {loading ? (
              <div className="size-9" aria-hidden="true" />
            ) : user ? (
              <UserMenu />
            ) : (
              <Button asChild variant="hero" size="sm" className="h-9 rounded-full px-4 text-sm sm:px-5">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
