import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/AdminSections";
export const Route = createFileRoute("/_authenticated/admin/activity")({
  head: () => ({ meta: [{ title: "Activity — Branta Films" }, { name: "description", content: "Manage activity in Branta Films administration." }, { property: "og:title", content: "Activity — Branta Films" }, { property: "og:description", content: "Branta Films administrator workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <AdminSection section="activity" />,
});
