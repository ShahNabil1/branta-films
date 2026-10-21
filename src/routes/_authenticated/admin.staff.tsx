import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/AdminSections";
export const Route = createFileRoute("/_authenticated/admin/staff")({
  head: () => ({ meta: [{ title: "Staff — Branta Films" }, { name: "description", content: "Manage staff in Branta Films administration." }, { property: "og:title", content: "Staff — Branta Films" }, { property: "og:description", content: "Branta Films administrator workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <AdminSection section="staff" />,
});
