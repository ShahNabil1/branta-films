import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { SeriesView } from "@/components/catalog/SeriesView";
import { catalogQuery, seriesQuery } from "@/lib/queries";
import { richTextToPlain } from "@/lib/rich-text";

export const Route = createFileRoute("/series/$slug")({
  staticData: { sitemap: true },
  loader: async ({ context, params }) => {
    const [series] = await Promise.all([
      context.queryClient.ensureQueryData(seriesQuery(params.slug)),
      context.queryClient.ensureQueryData(catalogQuery),
    ]);
    if (!series) throw notFound();
    return { title: series.title, description: series.tagline || richTextToPlain(series.description_html).slice(0, 160) };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — Branta Films` : "Series — Branta Films";
    const description = loaderData?.description ?? "Watch on Branta Films.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "video.tv_show" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: SeriesPage,
});

function SeriesPage() {
  const { slug } = Route.useParams();
  return (
    <SiteShell overlayHeader>
      <SeriesView slug={slug} />
    </SiteShell>
  );
}
