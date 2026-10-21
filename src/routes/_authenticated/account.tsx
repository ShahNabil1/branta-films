import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Film, LayoutDashboard, LogOut, Shield, UserRound } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { UserAvatar } from "@/components/site/UserMenu";
import { displayName, useAuth, useSignOut } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountLayout,
});

const NAV = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/account/library", label: "My library", icon: Film, exact: false },
  { to: "/account/profile", label: "Profile", icon: UserRound, exact: false },
  { to: "/account/security", label: "Sign-in & security", icon: Shield, exact: false },
] as const;

/** Dashboard shell: fixed-width sidebar that scrolls independently; content area never shifts. */
function AccountLayout() {
  const { profile, user } = useAuth();
  const signOut = useSignOut();
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <SiteHeader />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-background-alt md:flex">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <UserAvatar size="size-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{displayName(profile, user)}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <nav aria-label="Account" className="flex-1 space-y-1 p-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className="flex items-center gap-3 rounded-sm border-l-2 border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground data-[status=active]:border-primary data-[status=active]:bg-surface data-[status=active]:text-foreground"
              >
                <item.icon className="size-4" /> {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </aside>
        <div className="min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
          <nav aria-label="Account" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border px-4 py-2 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className="shrink-0 rounded-sm px-3 py-2 text-sm text-muted-foreground data-[status=active]:bg-surface data-[status=active]:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mx-auto max-w-5xl px-[clamp(1.25rem,4vw,3rem)] py-10">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
