import { createFileRoute } from "@tanstack/react-router";
import { WatchView } from "@/components/player/WatchView";

export const Route = createFileRoute("/_authenticated/watch/$episodeId")({
  head: () => ({
    meta: [
      { title: "Now playing — Branta Films" },
      { name: "description", content: "Watch Branta Films originals." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Now playing — Branta Films" },
      { property: "og:description", content: "Watch Branta Films originals." },
      { property: "og:type", content: "video.episode" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WatchPage,
});

function WatchPage() {
  const { episodeId } = Route.useParams();
  return <WatchView episodeId={episodeId} />;
}
