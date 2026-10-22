import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Film, LayoutDashboard, Receipt, Shield, UserRound } from "lucide-react";
import { DashboardShell, type DashNavSection } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountLayout,
});

const SECTIONS: DashNavSection[] = [
  {
    title: "Watch",
    items: [
      { to: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
      { to: "/account/library", label: "My library", icon: Film },
      { to: "/account/orders", label: "Orders & payments", icon: Receipt },
    ],
  },
  {
    title: "Account",
    items: [
      { to: "/account/profile", label: "Profile", icon: UserRound },
      { to: "/account/security", label: "Sign-in & security", icon: Shield },
    ],
  },
];

function AccountLayout() {
  return (
    <DashboardShell sections={SECTIONS} storageKey="bf-account-nav">
      <Outlet />
    </DashboardShell>
  );
}
