import { createFileRoute } from "@tanstack/react-router";
import { ContentEditor } from "@/components/admin/ContentEditor";
export const Route = createFileRoute("/_authenticated/admin/episodes/$id")({
  head: () => ({ meta: [{ title: "Edit episodes — Branta Films" }, { name: "description", content: "Create and edit Branta Films episodes." }, { property: "og:title", content: "Edit episodes — Branta Films" }, { property: "og:description", content: "Manage Branta Films content and media." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Editor,
});
function Editor() { const { id } = Route.useParams(); return <ContentEditor key={id} kind="episodes" id={id} />; }
