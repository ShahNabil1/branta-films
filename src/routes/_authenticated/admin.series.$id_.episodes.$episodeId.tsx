import { createFileRoute } from "@tanstack/react-router";
import { ContentEditor } from "@/components/admin/ContentEditor";
export const Route = createFileRoute("/_authenticated/admin/series/$id_/episodes/$episodeId")({
  head: () => ({ meta: [{ title: "Edit episode — Branta Films" }, { name: "description", content: "Create and edit an episode of a Branta Films series." }, { property: "og:title", content: "Edit episode — Branta Films" }, { property: "og:description", content: "Manage Branta Films episodes and media." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Editor,
});
function Editor() { const { id, episodeId } = Route.useParams(); return <ContentEditor key={episodeId} kind="episodes" id={episodeId} seriesId={id} />; }
