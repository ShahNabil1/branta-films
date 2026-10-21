import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/AdminSections";
export const Route = createFileRoute("/_authenticated/admin/series")({
  head: () => ({ meta: [{ title: "Series — Branta Films" }, { name: "description", content: "Manage series in Branta Films administration." }, { property: "og:title", content: "Series — Branta Films" }, { property: "og:description", content: "Branta Films administrator workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <AdminSection section="series" />,
});
