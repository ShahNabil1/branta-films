import { createFileRoute, notFound } from "@tanstack/react-router";
import { SeriesView } from "@/components/catalog/SeriesView";
import { catalogQuery, seriesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/account/series/$slug")({
  staticData: { sitemap: false },
  loader: async ({ context, params }) => {
    const [series] = await Promise.all([
      context.queryClient.ensureQueryData(seriesQuery(params.slug)),
      context.queryClient.ensureQueryData(catalogQuery),
    ]);
    if (!series) throw notFound();
    return { title: series.title };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — My Branta Films` : "Series — My Branta Films";
    return {
      meta: [
        { title },
        { name: "description", content: "Watch and unlock episodes right inside your Branta Films dashboard." },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: "Watch and unlock episodes right inside your Branta Films dashboard." },
        { property: "og:type", content: "video.tv_show" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: DashboardSeriesPage,
});

function DashboardSeriesPage() {
  const { slug } = Route.useParams();
  return <SeriesView slug={slug} inDashboard />;
}
