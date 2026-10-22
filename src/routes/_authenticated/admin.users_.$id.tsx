import { createFileRoute, type SearchSchemaInput } from '@tanstack/react-router';
import { personQuery } from '@/lib/people-queries';
import { PersonDetail } from '@/components/admin/PersonDetail';
export const Route=createFileRoute('/_authenticated/admin/users_/$id')({
  staticData: { sitemap: false },
  validateSearch:(s:{page?:unknown} & SearchSchemaInput)=>({page:Math.max(0,Math.floor(Number(s['page'])||0))}),
  loaderDeps:({search})=>search,
  loader:({context,params,deps})=>context.queryClient.ensureQueryData(personQuery(params.id,deps.page)),
  head:()=>({meta:[{title:'Account details — Branta Films'},{name:'description',content:'Private account, viewing and security management in Branta Films.'},{property:'og:title',content:'Account details — Branta Films'},{property:'og:description',content:'Branta Films account administration.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex'}]}),
  errorComponent:({error})=><p role="alert">{error instanceof Error ? error.message : 'Account unavailable.'}</p>,
  notFoundComponent:()=><p>Account not found.</p>,
  component:AccountPage,
});
function AccountPage(){const {id}=Route.useParams();const {page}=Route.useSearch();const navigate=Route.useNavigate();return <PersonDetail key={id} id={id} page={page} onPage={p=>void navigate({search:{page:p}})}/>;}