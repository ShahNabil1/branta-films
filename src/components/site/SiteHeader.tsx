import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Compass, House, Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/Logo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { CartButton } from "@/components/commerce/CartSheet";

const NAV = [
  { to: "/", label: "Home", icon: House, tone: "nav-home" },
  { to: "/browse", label: "Browse", icon: Compass, tone: "nav-browse" },
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
        <nav aria-label="Main" className="hidden flex-1 items-center sm:flex md:justify-center">
          <ul className="flex items-center gap-0.5">
            {NAV.map((item) => (
              <li key={item.to}>
                <Button asChild variant="ghost" className={cn("site-nav-action group h-11 gap-2 px-2 sm:px-4", item.tone)}>
                <Link to={item.to} activeOptions={{ exact: item.to === "/" }}>
                  <item.icon aria-hidden className="hidden sm:block" />
                  {item.label}
                  <span
                    aria-hidden
                    className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 scale-0 rounded-full bg-primary transition-transform duration-200 group-data-[status=active]:scale-100"
                  />
                </Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex shrink-0 items-center justify-end gap-1 sm:ml-0 sm:gap-2">
          <Button asChild variant="ghost" size="icon" className="site-nav-action nav-search size-11">
          <Link
            to="/browse"
            aria-label="Search series"
            title="Search series"
          >
            <Search className="size-[18px]" />
          </Link>
          </Button>
          <div className="hidden sm:block"><CartButton /></div>
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

/** Mobile bottom tab bar (industry-standard thumb-reach navigation). */
export function MobileTabBar() {
  const { items, setOpen } = useCart();
  const tab = "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors active:scale-95 data-[status=active]:text-primary";
  return (
    <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden">
      <div className="flex h-16">
        <Link to="/" activeOptions={{ exact: true }} className={tab}><House className="size-5" />Home</Link>
        <Link to="/browse" className={tab}><Compass className="size-5" />Browse</Link>
        <button type="button" onClick={() => setOpen(true)} className={tab} aria-label={`Cart, ${items.length} items`}>
          <span className="relative"><ShoppingCart className="size-5" />{items.length ? <span className="absolute -right-2.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">{items.length}</span> : null}</span>Cart
        </button>
      </div>
    </nav>
  );
}
