import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse" },
] as const;

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-16 border-b transition-colors duration-300",
        overlay && !scrolled ? "border-transparent bg-transparent" : "border-border bg-background/90 backdrop-blur-md",
        overlay && "-mb-16",
      )}
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-8 px-[clamp(1.25rem,4vw,3rem)]">
        <BrandLogo />
        <nav aria-label="Main" className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex min-w-24 items-center justify-end">
          {loading ? (
            <div className="size-9" aria-hidden="true" />
          ) : user ? (
            <UserMenu />
          ) : (
            <Button asChild size="sm" className="rounded-sm px-4">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
