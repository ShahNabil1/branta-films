import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { personQuery } from '@/lib/people-queries';
import { Panel } from '@/components/admin/AdminKit';
import { Button } from '@/components/ui/button';
import { LogOut, Film, Clock3 } from 'lucide-react';
import { formatWatchTime } from '@/lib/people-rules';
import { administerPerson } from '@/lib/people.functions';
export const Route=createFileRoute('/_authenticated/admin/view-as/$id')({
  staticData: { sitemap: false },
  loader:async({context,params})=>{await administerPerson({data:{id:params.id,action:'preview'}});return context.queryClient.ensureQueryData(personQuery(params.id));},
  head:()=>({meta:[{title:'Read-only account preview — Branta Films'},{name:'description',content:'Administrator read-only support view of a Branta Films viewer account.'},{property:'og:title',content:'Read-only account preview — Branta Films'},{property:'og:description',content:'Private administrator support preview.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex'}]}),
  errorComponent:({error})=><p role="alert">{error instanceof Error ? error.message : 'Account unavailable.'}</p>,notFoundComponent:()=><p>Viewer not found.</p>,component:Preview,
});
function Preview(){const {id}=Route.useParams();const {data}=useSuspenseQuery(personQuery(id));return <><div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-warning"><span className="text-sm font-semibold">Viewing {data.profile.email} · Read-only · Your admin identity is unchanged</span><Button asChild size="sm" variant="outline"><Link to="/admin/users/$id" params={{id}}><LogOut/>Exit preview</Link></Button></div><h1 className="text-2xl font-bold">{data.profile.full_name||'Member'}’s library</h1><Panel title="Unlocked series"><div className="divide-y divide-border">{data.unlocks.map(u=><div key={u.id} className="flex items-center gap-3 py-4"><Film className="size-5 text-primary"/><span className="text-sm font-semibold">{data.series.find(s=>s.id===u.series_id)?.title??'Series'}</span></div>)}</div>{!data.unlocks.length?<p className="text-muted-foreground">No series unlocked.</p>:null}</Panel><Panel title="Continue watching">{data.progress.filter(p=>!p.completed).map(p=><div key={p.episode_id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span>{p.episode?.series?.title} · {p.episode?.title}</span><span className="flex items-center gap-2 text-muted-foreground"><Clock3 className="size-4"/>{formatWatchTime(Number(p.position_seconds))}</span></div>)}</Panel></>;}