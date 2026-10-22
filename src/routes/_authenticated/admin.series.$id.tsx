import { createFileRoute } from "@tanstack/react-router";
import { ContentEditor } from "@/components/admin/ContentEditor";
export const Route = createFileRoute("/_authenticated/admin/series/$id")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Edit series — Branta Films" }, { name: "description", content: "Create and edit Branta Films series." }, { property: "og:title", content: "Edit series — Branta Films" }, { property: "og:description", content: "Manage Branta Films content and media." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Editor,
});
function Editor() { const { id } = Route.useParams(); return <ContentEditor key={id} kind="series" id={id} />; }
