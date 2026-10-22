import { createFileRoute, type SearchSchemaInput } from '@tanstack/react-router';
import { personQuery } from '@/lib/people-queries';
import { PersonDetail } from '@/components/admin/PersonDetail';
export const Route=createFileRoute('/_authenticated/admin/staff_/$id')({
  validateSearch:(s:{page?:unknown} & SearchSchemaInput)=>({page:Math.max(0,Math.floor(Number(s['page'])||0))}),
  loaderDeps:({search})=>search,
  loader:({context,params,deps})=>context.queryClient.ensureQueryData(personQuery(params.id,deps.page)),
  head:()=>({meta:[{title:'Staff account details — Branta Films'},{name:'description',content:'Manage a Branta Films staff account, sessions and series access.'},{property:'og:title',content:'Staff account details — Branta Films'},{property:'og:description',content:'Private Branta Films staff management.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex'}]}),
  errorComponent:({error})=><p role="alert">{error instanceof Error ? error.message : 'Account unavailable.'}</p>,
  notFoundComponent:()=><p>Staff account not found.</p>,
  component:StaffPage,
});
function StaffPage(){const {id}=Route.useParams();const {page}=Route.useSearch();const navigate=Route.useNavigate();return <PersonDetail key={id} staff id={id} page={page} onPage={p=>void navigate({search:{page:p}})}/>;}