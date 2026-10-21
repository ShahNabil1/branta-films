import { queryOptions } from "@tanstack/react-query";
import { getAdminOverview } from "./admin.functions";

export const adminQuery = queryOptions({ queryKey: ["admin-overview"], queryFn: () => getAdminOverview(), staleTime: 10000 });