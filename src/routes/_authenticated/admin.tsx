import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Film, LayoutDashboard, Users, Shield, KeyRound } from "lucide-react";
import { type DashNavSection } from "@/components/dashboard/DashboardShell";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminQuery } from "@/lib/admin-queries";

export const Route = createFileRoute("/_authenticated/admin")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery),
  errorComponent: ({ error }) => <main className="light min-h-svh bg-background p-8"><h1 className="text-h3">Admin panel unavailable</h1><p className="mt-4 text-muted-foreground">{error instanceof Error ? error.message : "Administrator access required."}</p><a href="/account" className="mt-6 inline-block text-primary">Back to account</a></main>,
  notFoundComponent: () => <p>Administration page unavailable.</p>,
  component: () => <AdminShell sections={sections}><Outlet /></AdminShell>,
});

const sections: DashNavSection[] = [
  { title: "Workspace", items: [{ to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true }, { to: "/admin/series", label: "Series", icon: Film }] },
  { title: "People & access", items: [{ to: "/admin/users", label: "Users", icon: Users }, { to: "/admin/staff", label: "Staff", icon: Shield }, { to: "/admin/unlocks", label: "Series access", icon: KeyRound }] },
];