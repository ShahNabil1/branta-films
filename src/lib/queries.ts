import { queryOptions } from "@tanstack/react-query";
import { getSeriesBySlug, listCatalog } from "./catalog.functions";

export const catalogQuery = queryOptions({ queryKey: ["catalog"], queryFn: () => listCatalog(), staleTime: 60_000 });

export const seriesQuery = (slug: string) =>
  queryOptions({ queryKey: ["series", slug], queryFn: () => getSeriesBySlug({ data: { slug } }), staleTime: 60_000 });
