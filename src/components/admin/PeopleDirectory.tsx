import { Link } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Activity, ArrowRight, ChevronLeft, ChevronRight, Clock3, Film, Plus, Search, Users, Wallet, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { directoryQuery } from '@/lib/people-queries';
import { inviteAdminStaff } from '@/lib/admin.functions';
import { formatWatchTime, isRestricted } from '@/lib/people-rules';
import { mediaUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrandedDialog } from '@/components/ui/branded-dialog';
import { Chip, Field, PageHeader, Panel } from './AdminKit';

export function PersonAvatar({name,url,large=false}:{name:string;url:string|null;large?:boolean}) {
  const [failed,setFailed]=useState(false);
  return <span className={`${large?'size-20 text-2xl':'size-11 text-sm'} grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 font-bold text-primary ring-1 ring-primary/20`}>{url&&!failed?<img alt={name} src={mediaUrl(url)??undefined} onError={()=>setFailed(true)} className="size-full object-cover"/>:name.slice(0,1).toUpperCase()}</span>;
}
export function PeopleDirectory({staff,search,page,onSearch,onPage}:{staff:boolean;search:string;page:number;onSearch:(v:string)=>void;onPage:(v:number)=>void}) {
  const {data}=useSuspenseQuery(directoryQuery(staff,search,page));
  const qc=useQueryClient();const inviteFn=useServerFn(inviteAdminStaff);
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
  const [invite,setInvite]=useState({email:'',full_name:'',role:'manager' as 'manager'|'admin'});
  const stats=[{label:staff?'Staff members':'Total users',value:data.stats.total,icon:staff?Shield:Users,tone:'text-primary'},{label:'Active',value:data.stats.active,icon:Activity,tone:'text-success'},{label:'Idle',value:data.stats.idle,icon:Clock3,tone:'text-warning'},{label:'Watching now',value:data.stats.watching,icon:Film,tone:'text-primary'},{label:'Paid users',value:data.stats.paid,icon:Wallet,tone:'text-success'},{label:'Free users',value:data.stats.free,icon:Users,tone:'text-muted-foreground'}];
  return <>
    <PageHeader title={staff?'Staff':'Users'} action={staff?<Button onClick={()=>setOpen(true)}><Plus/>Invite staff</Button>:<Chip tone="success">Live audience</Chip>}/>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">{stats.map(({label,value,icon:Icon,tone})=><div key={label} className="admin-rise rounded-2xl border border-border bg-card p-4"><div className={`flex items-center justify-between ${tone}`}><Icon className="size-5"/><span className="text-2xl font-bold tabular-nums">{value}</span></div><p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p></div>)}</div>
    <Panel title={staff?'Team directory':'Audience directory'} action={<span className="text-xs text-muted-foreground">{data.total} accounts</span>}>
      <div className="relative mb-5 max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input aria-label="Search accounts" className="pl-10" placeholder="Search name or email…" value={search} onChange={e=>onSearch(e.target.value)}/></div>
      <div className="hidden grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_100px] gap-3 border-b border-border px-3 pb-3 text-xs font-semibold text-muted-foreground xl:grid"><span>Account</span><span>Presence</span><span>Series access</span><span>Watch time</span><span/></div>
      <div className="divide-y divide-border">{data.people.map(p=><div key={p.id} className="group grid min-w-0 gap-4 rounded-xl px-3 py-4 transition-colors hover:bg-muted/60 sm:grid-cols-2 xl:grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_100px] xl:items-center">
        <div className="flex min-w-0 items-center gap-3"><PersonAvatar name={p.full_name||p.email} url={p.avatar_url}/><div className="min-w-0"><p className="break-words text-sm font-semibold">{p.full_name||'Member'}</p><p className="break-all text-xs text-muted-foreground">{p.email}</p>{staff?<span className="mt-1 inline-block"><Chip tone={p.role==='admin'?'brand':'neutral'}>{p.role}</Chip></span>:null}</div></div>
        <div><Chip tone={p.status==='active'||p.status==='watching'?'success':'neutral'}>{isRestricted(p.banned_until)?'Banned':p.status}</Chip>{p.watching?<p className="mt-2 break-words text-xs text-muted-foreground">{p.watching}</p>:p.last_seen_at?<p className="mt-2 text-xs text-muted-foreground">{new Date(p.last_seen_at).toLocaleString()}</p>:null}</div>
        <div><Chip tone={p.paid?'brand':'neutral'}>{p.paid?'Paid user':'Free user'}</Chip></div><p className="text-sm font-semibold tabular-nums">{formatWatchTime(p.watched_seconds)}</p>
        <Button asChild variant="outline" size="sm" className="justify-self-start">{staff?<Link to="/admin/staff/$id" params={{id:p.id}}>Details<ArrowRight/></Link>:<Link to="/admin/users/$id" params={{id:p.id}}>Details<ArrowRight/></Link>}</Button>
      </div>)}</div>
      {!data.people.length?<div className="py-14 text-center"><Users className="mx-auto size-8 text-muted-foreground"/><p className="mt-3 text-sm text-muted-foreground">No accounts found.</p></div>:null}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4"><span className="text-xs text-muted-foreground">Page {page+1} of {Math.max(1,Math.ceil(data.total/25))}</span><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Previous page" disabled={!page} onClick={()=>onPage(page-1)}><ChevronLeft/></Button><Button variant="outline" size="icon" aria-label="Next page" disabled={(page+1)*25>=data.total} onClick={()=>onPage(page+1)}><ChevronRight/></Button></div></div>
    </Panel>
    <BrandedDialog open={open} onClose={()=>setOpen(false)} title="Invite staff" className="admin-theme"><form className="space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await inviteFn({data:invite});toast.success('Invitation sent');setOpen(false);setInvite({email:'',full_name:'',role:'manager'});await qc.invalidateQueries({queryKey:['people']});}catch(err){toast.error(err instanceof Error?err.message:'Could not send invite');}finally{setBusy(false);}}}><Field label="Full name"><Input required maxLength={100} value={invite.full_name} onChange={e=>setInvite({...invite,full_name:e.target.value})}/></Field><Field label="Email"><Input type="email" required maxLength={254} value={invite.email} onChange={e=>setInvite({...invite,email:e.target.value})}/></Field><Field label="Access"><Select value={invite.role} onValueChange={v=>setInvite({...invite,role:v as typeof invite.role})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent className="admin-theme"><SelectItem value="manager">Manager</SelectItem><SelectItem value="admin">Administrator</SelectItem></SelectContent></Select></Field><Button disabled={busy||!invite.email||!invite.full_name}><Plus/>Send invite</Button></form></BrandedDialog>
  </>;
}