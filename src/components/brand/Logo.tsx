import { Link } from "@tanstack/react-router";
import logo from "@/assets/brand/branta-logo-light.png";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link to="/" aria-label="Branta Films home" className={cn("flex shrink-0 items-center gap-1.5 rounded-sm sm:gap-2", className)}>
      <img src={logo} alt="Branta" width={1288} height={308} className="h-5 w-auto sm:h-6" draggable={false} />
      <span className="brand-films text-media-ink">Films</span>
    </Link>
  );
}
