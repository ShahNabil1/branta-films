import { createFileRoute, notFound } from "@tanstack/react-router";
import { SeriesView } from "@/components/catalog/SeriesView";
import { catalogQuery, seriesQuery } from "@/lib/queries";
import { contentSeo, seoHead } from "@/lib/content-seo";

export const Route = createFileRoute("/_authenticated/account/series/$slug")({
  staticData: { sitemap: false },
  loader: async ({ context, params }) => {
    const [series] = await Promise.all([
      context.queryClient.ensureQueryData(seriesQuery(params.slug)),
      context.queryClient.ensureQueryData(catalogQuery),
    ]);
    if (!series) throw notFound();
    return { seo: contentSeo(series) };
  },
  head: ({ loaderData, params }) => seoHead(loaderData?.seo ?? contentSeo({ title: "My series" }), `/account/series/${encodeURIComponent(params.slug)}`, "video.tv_show", true),
  component: DashboardSeriesPage,
});

function DashboardSeriesPage() {
  const { slug } = Route.useParams();
  return <SeriesView slug={slug} inDashboard />;
}
