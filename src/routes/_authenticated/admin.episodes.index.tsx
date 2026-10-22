import { createFileRoute, redirect } from "@tanstack/react-router";
// Episodes are managed inside each series; keep the old address working.
export const Route = createFileRoute("/_authenticated/admin/episodes/")({
  head: () => ({ meta: [{ title: "Episode management — Branta Films" }, { name: "description", content: "Manage episodes inside their Branta Films series." }, { property: "og:title", content: "Episode management — Branta Films" }, { property: "og:description", content: "Private series episode administration." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: () => { throw redirect({ to: "/admin/series", replace: true }); },
});
