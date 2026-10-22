import { createFileRoute, notFound } from "@tanstack/react-router";
import { WatchView } from "@/components/player/WatchView";
import { episodeDetailsQuery } from "@/lib/queries";
import { contentSeo, seoHead } from "@/lib/content-seo";

export const Route = createFileRoute("/_authenticated/account/watch/$episodeId")({
  staticData: { sitemap: false },
  loader: async ({ context, params }) => {
    const ep = await context.queryClient.ensureQueryData(episodeDetailsQuery(params.episodeId));
    if (!ep?.series) throw notFound();
    return contentSeo(ep, { seriesTitle: ep.series.title, number: ep.episode_number, fallbackImage: ep.series.backdrop_url ?? ep.series.poster_url });
  },
  head: ({ loaderData, params }) => seoHead(loaderData ?? contentSeo({ title: "Now playing" }), `/account/watch/${params.episodeId}`, "video.episode", true),
  component: WatchPage,
});

function WatchPage() {
  const { episodeId } = Route.useParams();
  return <WatchView episodeId={episodeId} inDashboard />;
}
