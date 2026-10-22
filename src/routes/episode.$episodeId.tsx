import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Play, ArrowLeft } from "lucide-react";
import { episodeDetailsQuery } from "@/lib/queries";
import { contentSeo, seoHead, jsonLd, SITE_URL } from "@/lib/content-seo";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/content/RichText";
import { mediaUrl } from "@/lib/media";
import { formatDuration } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/episode/$episodeId")({
  staticData: { sitemap: true },
  loader: async ({ context, params }) => {
    const episode = await context.queryClient.ensureQueryData(episodeDetailsQuery(params.episodeId));
    if (!episode?.series) throw notFound();
    return { episode, series: episode.series, seo: contentSeo(episode, { seriesTitle: episode.series.title, number: episode.episode_number, fallbackImage: episode.series.backdrop_url ?? episode.series.poster_url }) };
  },
  head: ({ loaderData, params }) => {
    const path = `/episode/${params.episodeId}`;
    const seo = loaderData?.seo ?? contentSeo({ title: "Episode" });
    return { ...seoHead(seo, path, "video.episode"), scripts: loaderData ? [jsonLd({ "@context": "https://schema.org", "@type": "TVEpisode", name: loaderData.episode.title, description: seo.description, url: `${SITE_URL}${path}`, episodeNumber: loaderData.episode.episode_number, ...(loaderData.episode.duration_seconds ? { duration: `PT${loaderData.episode.duration_seconds}S` } : {}), ...(seo.image ? { image: seo.image } : {}), partOfSeries: { "@type": "TVSeries", name: loaderData.series.title, url: `${SITE_URL}/series/${loaderData.series.slug}` }, keywords: "AI-generated web series" })] : [] };
  },
  component: EpisodePage,
});
function EpisodePage() {
  const { episode, series } = Route.useLoaderData();
  const { user } = useAuth();
  const image = mediaUrl(episode.thumbnail_url ?? series.backdrop_url ?? series.poster_url);
  return <SiteShell><main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
    <Button asChild variant="ghost" className="mb-6"><Link to="/series/$slug" params={{ slug: series.slug }}><ArrowLeft />{series.title}</Link></Button>
    {image ? <img src={image} alt={`${episode.title} episode artwork`} width={1280} height={720} className="aspect-video w-full rounded-md object-cover" /> : null}
    <p className="mt-8 text-sm text-primary">AI-generated series · Episode {episode.episode_number}</p>
    <h1 className="mt-3 break-words text-h1 font-semibold">{episode.title}</h1>
    {episode.duration_seconds > 0 ? <p className="mt-3 text-sm text-muted-foreground">{formatDuration(episode.duration_seconds)}</p> : null}
    <RichText html={episode.synopsis_html} className="mt-6 text-foreground/85" />
    <Button asChild size="lg" className="mt-8">{user ? <Link to="/account/watch/$episodeId" params={{ episodeId: episode.id }}><Play />Watch episode</Link> : <Link to="/auth" search={{ redirect: `/account/watch/${episode.id}` }}><Play />Sign in to watch</Link>}</Button>
  </main></SiteShell>;
}