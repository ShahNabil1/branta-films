import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { PeopleDirectory } from "@/components/admin/PeopleDirectory";
import { directoryQuery } from "@/lib/people-queries";
export const Route = createFileRoute("/_authenticated/admin/users")({
  validateSearch: (s: { search?: unknown; page?: unknown } & SearchSchemaInput) => ({ search: typeof s['search'] === 'string' ? s['search'].slice(0, 200) : '', page: Math.max(0, Math.floor(Number(s['page']) || 0)) }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(directoryQuery(false, deps.search, deps.page)),
  errorComponent: ({ error }) => <p role="alert">{error instanceof Error ? error.message : 'Accounts unavailable.'}</p>,
  notFoundComponent: () => <p>Accounts unavailable.</p>,
  head: () => ({ meta: [{ title: "Users — Branta Films" }, { name: "description", content: "Manage users in Branta Films administration." }, { property: "og:title", content: "Users — Branta Films" }, { property: "og:description", content: "Branta Films administrator workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: UsersPage,
});
function UsersPage() {
  const { search, page } = Route.useSearch(); const navigate = Route.useNavigate();
  return <PeopleDirectory staff={false} search={search} page={page} onSearch={value => void navigate({ search: { search: value, page: 0 }, replace: true })} onPage={value => void navigate({ search: { search, page: value } })} />;
}
