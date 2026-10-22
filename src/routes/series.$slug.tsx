import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { SeriesView } from "@/components/catalog/SeriesView";
import { catalogQuery, seriesQuery } from "@/lib/queries";
import { contentSeo, seoHead, jsonLd, SITE_URL } from "@/lib/content-seo";

export const Route = createFileRoute("/series/$slug")({
  staticData: { sitemap: true },
  loader: async ({ context, params }) => {
    const [series] = await Promise.all([
      context.queryClient.ensureQueryData(seriesQuery(params.slug)),
      context.queryClient.ensureQueryData(catalogQuery),
    ]);
    if (!series) throw notFound();
    return { series, seo: contentSeo(series) };
  },
  head: ({ loaderData, params }) => {
    const seo = loaderData?.seo ?? contentSeo({ title: "Series" });
    const path = `/series/${encodeURIComponent(params.slug)}`;
    const s = loaderData?.series;
    return { ...seoHead(seo, path), scripts: s ? [jsonLd({ "@context": "https://schema.org", "@type": "TVSeries", "@id": `${SITE_URL}${path}#series`, url: `${SITE_URL}${path}`, name: s.title, description: seo.description, ...(seo.image ? { image: seo.image } : {}), genre: s.genres, ...(s.release_year ? { datePublished: String(s.release_year) } : {}), contentRating: s.maturity_rating, numberOfEpisodes: s.episodes.length, productionCompany: { "@type": "Organization", name: "Branta Tech", url: "https://brantatech.com" }, keywords: "AI-generated web series", episode: s.episodes.map(e => ({ "@type": "TVEpisode", name: e.title, episodeNumber: e.episode_number, url: `${SITE_URL}/episode/${e.id}` })) }), jsonLd({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Branta Films", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Browse series", item: `${SITE_URL}/browse` }, { "@type": "ListItem", position: 3, name: s.title, item: `${SITE_URL}${path}` }] })] : [] };
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
