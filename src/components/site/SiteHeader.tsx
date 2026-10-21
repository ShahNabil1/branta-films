import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Search } from "lucide-react";
import { BrandLogo } from "@/components/brand/Logo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse" },
] as const;

const itemCls =
  "text-small relative flex h-9 items-center whitespace-nowrap rounded-sm px-2 font-medium sm:px-3 text-muted-foreground transition-colors duration-150 hover:text-foreground data-[status=active]:text-foreground";

/**
 * Branta Tech header: logo, centred nav with an orange dot under the active page,
 * sign-in link + pill CTA. Over a cinematic hero it starts transparent and turns solid on scroll.
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
        "sticky top-0 z-40 h-16 border-b transition-[background-color,border-color] duration-500 xl:h-[68px]",
        clear ? "border-transparent bg-linear-to-b from-background/85 to-transparent" : "border-border bg-background/90 backdrop-blur-xl",
        overlay && "-mb-16 xl:-mb-[68px]",
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-[1600px] items-center gap-2 px-4 sm:gap-6 sm:px-5 md:px-8">
        <BrandLogo />
        <nav aria-label="Main" className="flex flex-1 items-center md:justify-center">
          <ul className="flex items-center gap-0.5">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} activeOptions={{ exact: item.to === "/" }} className={cn(itemCls, "group")}>
                  {item.label}
                  <span
                    aria-hidden
                    className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 scale-0 rounded-full bg-primary transition-transform duration-200 group-data-[status=active]:scale-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
          <Link
            to="/browse"
            aria-label="Search series"
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <Search className="size-[18px]" />
          </Link>
          {loading ? (
            <div className="size-9" aria-hidden="true" />
          ) : user ? (
            <UserMenu />
          ) : (
            <>
              <Link to="/auth" className={cn(itemCls, "hidden sm:flex")}>
                Sign in
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="text-small group ml-1 hidden h-10 items-center gap-1.5 rounded-full bg-primary px-5 font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:inline-flex"
              >
                Start watching
                <ArrowUpRight aria-hidden className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/auth"
                className="text-small inline-flex h-9 items-center whitespace-nowrap rounded-full bg-primary px-4 font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:hidden"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
