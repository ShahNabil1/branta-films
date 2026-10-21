import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/AdminSections";
export const Route = createFileRoute("/_authenticated/admin/episodes")({
  head: () => ({ meta: [{ title: "Episodes — Branta Films" }, { name: "description", content: "Manage episodes in Branta Films administration." }, { property: "og:title", content: "Episodes — Branta Films" }, { property: "og:description", content: "Branta Films administrator workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <AdminSection section="episodes" />,
});
