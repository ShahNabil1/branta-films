import { createFileRoute } from "@tanstack/react-router";
import { PeopleDirectory } from "@/components/admin/PeopleDirectory";
import { directoryQuery } from "@/lib/people-queries";
export const Route = createFileRoute("/_authenticated/admin/staff")({
  validateSearch: (s: Record<string, unknown>) => ({ search: typeof s['search'] === 'string' ? s['search'].slice(0, 200) : '', page: Math.max(0, Math.floor(Number(s['page']) || 0)) }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(directoryQuery(true, deps.search, deps.page)),
  errorComponent: ({ error }) => <p role="alert">{error.message}</p>,
  notFoundComponent: () => <p>Staff accounts unavailable.</p>,
  head: () => ({ meta: [{ title: "Staff — Branta Films" }, { name: "description", content: "Manage staff in Branta Films administration." }, { property: "og:title", content: "Staff — Branta Films" }, { property: "og:description", content: "Branta Films administrator workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: StaffPage,
});
function StaffPage() {
  const { search, page } = Route.useSearch(); const navigate = Route.useNavigate();
  return <PeopleDirectory staff search={search} page={page} onSearch={value => void navigate({ search: { search: value, page: 0 }, replace: true })} onPage={value => void navigate({ search: { search, page: value } })} />;
}
