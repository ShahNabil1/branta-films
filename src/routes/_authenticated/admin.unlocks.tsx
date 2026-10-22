import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/AdminSections";
export const Route = createFileRoute("/_authenticated/admin/unlocks")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Series access — Branta Films" }, { name: "description", content: "Manage unlocks in Branta Films administration." }, { property: "og:title", content: "Series access — Branta Films" }, { property: "og:description", content: "Branta Films administrator workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <AdminSection section="unlocks" />,
});
