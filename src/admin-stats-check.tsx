import React from "react";
import { createRoot } from "react-dom/client";
import { createRouter, createRootRoute, RouterProvider } from "@tanstack/react-router";
import { Film, Users, Shield, Clapperboard } from "lucide-react";
import { StatTile } from "./components/admin/AdminKit";
export function mount() {
  const root = createRootRoute({ component: () => <main className="admin-theme min-h-screen bg-background p-4"><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[{ label: "Series", value: 3, icon: Film }, { label: "Episodes", value: 7, icon: Clapperboard }, { label: "Users", value: 2, icon: Users }, { label: "Staff", value: 1, icon: Shield }].map(s => <StatTile key={s.label} to="/" {...s}/>)}</div></main> });
  const router = createRouter({ routeTree: root });
  createRoot(document.body).render(<RouterProvider router={router}/>);
}