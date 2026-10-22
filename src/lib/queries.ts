import { queryOptions } from "@tanstack/react-query";
import { getSeriesBySlug, listCatalog, getEpisodeDetails } from "./catalog.functions";

export const catalogQuery = queryOptions({ queryKey: ["catalog"], queryFn: () => listCatalog(), staleTime: 60_000 });
export const episodeDetailsQuery = (episodeId: string) => queryOptions({ queryKey: ["episode-details", episodeId], queryFn: () => getEpisodeDetails({ data: { episodeId } }), staleTime: 60_000 });

export const seriesQuery = (slug: string) =>
  queryOptions({ queryKey: ["series", slug], queryFn: () => getSeriesBySlug({ data: { slug } }), staleTime: 60_000 });
