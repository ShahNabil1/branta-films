import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass, House, Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/Logo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { CartButton } from "@/components/commerce/CartSheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NAV = [
  { to: "/", label: "Home", tone: "nav-home" },
  { to: "/browse", label: "Browse", tone: "nav-browse" },
] as const;

/**
 * Text navigation, quiet utility controls and one account action.
 * Over a cinematic hero it starts transparent and turns solid on scroll.
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
      <TooltipProvider delayDuration={250}>
      <div className="mx-auto flex h-full w-full max-w-[1600px] items-center gap-2 px-4 sm:gap-6 sm:px-5 md:gap-10 md:px-8">
        <BrandLogo />
        <nav aria-label="Main" className="hidden flex-1 items-center sm:flex">
          <ul className="flex items-center gap-1 md:gap-3">
            {NAV.map((item) => (
              <li key={item.to}>
                <Button asChild variant="ghost" className={cn("header-nav group h-11 rounded-sm px-3 md:px-4", item.tone)}>
                <Link to={item.to} activeOptions={{ exact: item.to === "/" }}>
                  {item.label}
                  <span
                    aria-hidden
                    className="absolute inset-x-3 bottom-0 h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform duration-200 group-data-[status=active]:scale-x-100 md:inset-x-4"
                  />
                </Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex shrink-0 items-center justify-end gap-1 sm:ml-0 sm:gap-2">
          <Tooltip>
          <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon" className="header-utility nav-search size-11">
          <Link
            to="/browse"
            aria-label="Search series"
          >
            <Search className="size-[18px]" />
          </Link>
          </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-popover text-popover-foreground border border-border">Search series</TooltipContent>
          </Tooltip>
          <div className="hidden sm:block"><CartButton /></div>
          <span aria-hidden className="mx-2 hidden h-5 w-px bg-border sm:block" />
          {loading ? (
            <div className="size-9" aria-hidden="true" />
          ) : user ? (
            <UserMenu />
          ) : (
            <Button asChild className="h-11 gap-2 px-4 sm:px-5">
              <Link to="/auth">Sign in<ArrowRight aria-hidden className="hidden sm:block" /></Link>
            </Button>
          )}
        </div>
      </div>
      </TooltipProvider>
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
        <Button variant="ghost" onClick={() => setOpen(true)} className={cn(tab, "h-full rounded-none px-0")} aria-label={`Cart, ${items.length} items`}>
          <span className="relative"><ShoppingCart className="size-5" />{items.length ? <span className="absolute -right-2.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">{items.length}</span> : null}</span>Cart
        </Button>
      </div>
    </nav>
  );
}
