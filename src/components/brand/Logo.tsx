import { Link } from "@tanstack/react-router";
import logo from "@/assets/brand/branta-logo-light.png";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link to="/" aria-label="Branta Films home" className={cn("flex shrink-0 items-center gap-3 rounded-sm", className)}>
      <img src={logo} alt="Branta Tech" width={1288} height={308} className="h-7 w-auto" draggable={false} />
      <span className="hidden border-l border-border pl-3 text-eyebrow text-primary sm:inline">Films</span>
    </Link>
  );
}
