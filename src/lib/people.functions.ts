import { createServerFn, createMiddleware } from '@tanstack/react-start';
import { z } from 'zod';
import { requireAccountAccess } from './security-middleware';
import { assertTarget, hasPaidAccess, presenceStatus } from './people-rules';
import { validateNewPassword, PASSWORD_REUSED_MESSAGE } from './validation';

const requirePeopleAdmin=createMiddleware({type:'function'}).middleware([requireAccountAccess]).server(async({context,next})=>{
  const {data,error}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
  if(error||!data) throw new Error('Administrator access required.');
  return next();
});
const targetSchema=z.object({id:z.string().uuid()});
export const getPeopleDirectory=createServerFn({method:'POST'}).middleware([requirePeopleAdmin])
  .inputValidator((v:unknown)=>z.object({staff:z.boolean(),search:z.string().trim().max(200),page:z.number().int().min(0)}).parse(v))
  .handler(async({data})=>{
    const {supabaseAdmin:sb}=await import('@/integrations/supabase/client.server');
    // Read all summaries in pages; do not truncate the directory at PostgREST's row cap.
    async function all<T>(read:(a:number,b:number)=>PromiseLike<{data:T[]|null;error:{message:string}|null}>){const out:T[]=[];for(let a=0;;a+=500){const r=await read(a,a+499);if(r.error)throw new Error(r.error.message);out.push(...r.data??[]);if((r.data?.length??0)<500)return out;}}
    const [profiles,roles,sessions,unlocks,series,episodes,restrictions]=await Promise.all([
      all((a,b)=>sb.from('profiles').select('*').order('id').range(a,b)),all((a,b)=>sb.from('user_roles').select('user_id,role').order('id').range(a,b)),all((a,b)=>sb.from('viewer_sessions').select('user_id,state,last_seen_at,revoked_at,current_episode_id,watched_seconds').order('session_id').range(a,b)),all((a,b)=>sb.from('series_unlocks').select('user_id,series_id').order('id').range(a,b)),all((a,b)=>sb.from('series').select('id,title,price_bdt').order('id').range(a,b)),all((a,b)=>sb.from('episodes').select('id,series_id,title').order('id').range(a,b)),all((a,b)=>sb.from('account_restrictions').select('user_id,banned_until').order('user_id').range(a,b)),
    ]);
    const audience=profiles.filter(p=>data.staff?roles.some(r=>r.user_id===p.id):!roles.some(r=>r.user_id===p.id)).map(p=>{
      const devices=sessions.filter(s=>s.user_id===p.id);const status=presenceStatus(devices);
      const watching=devices.find(s=>s.state==='watching'&&!s.revoked_at&&Date.now()-Date.parse(s.last_seen_at)<90_000);
      const episode=episodes.find(e=>e.id===watching?.current_episode_id);
      return {...p,role:roles.find(r=>r.user_id===p.id&&r.role==='admin')?.role??roles.find(r=>r.user_id===p.id)?.role??'viewer',status,paid:hasPaidAccess(unlocks.filter(u=>u.user_id===p.id),series),watching:series.find(s=>s.id===episode?.series_id)?.title??null,watched_seconds:devices.reduce((a,s)=>a+Number(s.watched_seconds),0),last_seen_at:devices.map(s=>s.last_seen_at).sort().at(-1)??null,banned_until:restrictions.find(r=>r.user_id===p.id)?.banned_until??null};
    });
    const filtered=audience.filter(p=>`${p.full_name} ${p.email}`.toLowerCase().includes(data.search.toLowerCase()));
    return {people:filtered.slice(data.page*25,data.page*25+25),total:filtered.length,stats:{total:audience.length,active:audience.filter(p=>p.status==='active').length,idle:audience.filter(p=>p.status==='idle').length,watching:audience.filter(p=>p.status==='watching').length,paid:audience.filter(p=>p.paid).length,free:audience.filter(p=>!p.paid).length}};
  });

export const getPersonDetail=createServerFn({method:'POST'}).middleware([requirePeopleAdmin]).inputValidator((v:unknown)=>targetSchema.extend({page:z.number().int().min(0).default(0)}).parse(v)).handler(async({data})=>{
  const {supabaseAdmin:sb}=await import('@/integrations/supabase/client.server');
  async function all<T>(read:(a:number,b:number)=>PromiseLike<{data:T[]|null;error:{message:string}|null}>){const rows:T[]=[];for(let a=0;;a+=500){const r=await read(a,a+499);if(r.error)throw new Error(r.error.message);rows.push(...r.data??[]);if((r.data?.length??0)<500)return {data:rows,error:null};}}
  const [profile,account,roles,sessions,keys,unlocks,history,progress,activity,restriction,series]=await Promise.all([
    sb.from('profiles').select('*').eq('id',data.id).single(),sb.auth.admin.getUserById(data.id),sb.from('user_roles').select('role').eq('user_id',data.id),sb.from('viewer_sessions').select('*').eq('user_id',data.id).order('last_seen_at',{ascending:false}).range(data.page*25,data.page*25+24),all((a,b)=>sb.from('passkey_credentials').select('id,device_name,transports,created_at,last_used_at').eq('user_id',data.id).order('id').range(a,b)),all((a,b)=>sb.from('series_unlocks').select('id,series_id,source,created_at').eq('user_id',data.id).order('id').range(a,b)),sb.from('viewer_watch_history').select('*,episode:episode_id(title,episode_number,series:series_id(title))').eq('user_id',data.id).order('last_watched_at',{ascending:false}).range(data.page*25,data.page*25+24),sb.from('watch_progress').select('*,episode:episode_id(title,episode_number,series:series_id(title))').eq('user_id',data.id).order('updated_at',{ascending:false}).range(data.page*25,data.page*25+24),sb.from('activity_log').select('id,action,created_at,ip,actor_id').eq('user_id',data.id).order('created_at',{ascending:false}).range(data.page*25,data.page*25+24),sb.from('account_restrictions').select('*').eq('user_id',data.id).maybeSingle(),all((a,b)=>sb.from('series').select('id,title,poster_url,price_bdt').order('title').order('id').range(a,b)),
  ]);
  for(const r of [profile,account,roles,sessions,keys,unlocks,history,progress,activity,restriction,series]) if(r.error)throw new Error(r.error.message);
  if(!profile.data||!account.data.user)throw new Error('Account unavailable.');
  const blocks=await all((a,b)=>sb.from('security_blocks').select('id,kind,value,reason').order('id').range(a,b));if(blocks.error)throw new Error(blocks.error.message);
  const user=account.data.user;
  const identifiers=new Set([profile.data.email.toLowerCase(),...(sessions.data??[]).flatMap(s=>[s.ip,s.device_hash])]);
  return {profile:profile.data,auth:{last_sign_in_at:user.last_sign_in_at??null,email_confirmed_at:user.email_confirmed_at??null,providers:(user.identities??[]).map(i=>i.provider),banned_until:user.banned_until??null},roles:roles.data??[],sessions:sessions.data??[],passkeys:keys.data??[],unlocks:unlocks.data??[],history:history.data??[],progress:progress.data??[],activity:activity.data??[],restriction:restriction.data,series:series.data??[],blocks:(blocks.data??[]).filter(b=>identifiers.has(b.value)),page:data.page};
});

export const administerPerson=createServerFn({method:'POST'}).middleware([requirePeopleAdmin])
  .inputValidator((v:unknown)=>z.discriminatedUnion('action',[
    targetSchema.extend({action:z.literal('ban'),hours:z.number().int().min(1).max(8760),reason:z.string().trim().min(1).max(500)}),targetSchema.extend({action:z.literal('unban')}),targetSchema.extend({action:z.literal('email'),email:z.string().trim().email().max(254)}),targetSchema.extend({action:z.literal('password'),password:z.string().max(200)}),targetSchema.extend({action:z.literal('revoke-session'),session:z.string().uuid()}),targetSchema.extend({action:z.literal('preview')}),
  ]).parse(v)).handler(async({data,context})=>{
    const {supabaseAdmin:sb}=await import('@/integrations/supabase/client.server');
    const {data:roles,error:re}=await context.supabase.from('user_roles').select('role').eq('user_id',data.id);if(re)throw new Error(re.message);
    if(data.action!=='preview') assertTarget(context.userId,data.id,(roles??[]).map(r=>r.role));
    if(data.action==='preview' && (roles??[]).length)throw new Error('View-as is available for viewer accounts only.');
    if(data.action==='ban'||data.action==='unban'){
      const until=data.action==='ban'?new Date(Date.now()+data.hours*3600_000).toISOString():null;
      const {error}=await sb.from('account_restrictions').upsert({user_id:data.id,banned_until:until,reason:data.action==='ban'?data.reason:'',updated_by:context.userId});if(error)throw new Error(error.message);
      const {error:ae}=await sb.auth.admin.updateUserById(data.id,{ban_duration:data.action==='ban'?`${data.hours}h`:'none'});if(ae)throw new Error(ae.message);
    }
    if(data.action==='email'){const {error}=await sb.auth.admin.updateUserById(data.id,{email:data.email,email_confirm:true});if(error)throw new Error(error.message);}
    if(data.action==='password'){
      const invalid=validateNewPassword(data.password);if(invalid)throw new Error(invalid);
      const {data:reused,error}=await sb.rpc('password_is_reused',{_user_id:data.id,_password:data.password});if(error)throw new Error(error.message);if(reused)throw new Error(PASSWORD_REUSED_MESSAGE);
      const {error:se}=await sb.rpc('snapshot_current_password',{_user_id:data.id});if(se)throw new Error(se.message);
      const {error:pe}=await sb.auth.admin.updateUserById(data.id,{password:data.password});if(pe)throw new Error(pe.message);
    }
    if(data.action==='revoke-session'){const {data:row,error}=await sb.from('viewer_sessions').update({revoked_at:new Date().toISOString()}).eq('user_id',data.id).eq('session_id',data.session).select('session_id').single();if(error||!row)throw new Error('Session unavailable.');}
    const {logActivityAs}=await import('./request-meta.server');await logActivityAs(data.id,`admin_${data.action}`,data.action==='ban'?{hours:data.hours,reason:data.reason}:{},context.userId);
    return {ok:true};
  });

export const setPersonBlocks=createServerFn({method:'POST'}).middleware([requirePeopleAdmin])
  .inputValidator((v:unknown)=>targetSchema.extend({blocked:z.boolean(),identifiers:z.array(z.object({kind:z.enum(['email','ip','fingerprint']),value:z.string().min(1).max(254)})).min(1).max(100)}).parse(v))
  .handler(async({data,context})=>{
    const {supabaseAdmin:sb}=await import('@/integrations/supabase/client.server');
    const [{data:roles,error:re},{data:profile,error:pe},{data:sessions,error:se}]=await Promise.all([context.supabase.from('user_roles').select('role').eq('user_id',data.id),sb.from('profiles').select('email').eq('id',data.id).single(),sb.from('viewer_sessions').select('ip,device_hash').eq('user_id',data.id)]);
    if(re||pe||se||!profile)throw new Error('Could not verify these identifiers.');assertTarget(context.userId,data.id,(roles??[]).map(r=>r.role));
    const {data:actorSessions,error:as}=await sb.from('viewer_sessions').select('ip,device_hash').eq('user_id',context.userId);if(as)throw new Error(as.message);
    for(const item of data.identifiers){
      const known=item.kind==='email'?item.value===profile.email.toLowerCase():sessions?.some(s=>item.value===(item.kind==='ip'?s.ip:s.device_hash));
      if(!known)throw new Error('Select an identifier observed on this account.');
      const {trustedRequestMeta}=await import('./security.server');
      if(data.blocked && (item.kind==='ip'&&item.value===trustedRequestMeta().ip || actorSessions?.some(s=>item.value===(item.kind==='ip'?s.ip:s.device_hash))))throw new Error('This identifier is shared with your current administrator account.');
    }
    if(data.blocked){const {error}=await sb.from('security_blocks').upsert(data.identifiers.map(i=>({...i,blocked_by:context.userId})),{onConflict:'kind,value'});if(error)throw new Error(error.message);}
    else for(const i of data.identifiers){const {error}=await sb.from('security_blocks').delete().eq('kind',i.kind).eq('value',i.value);if(error)throw new Error(error.message);}
    const {logActivityAs}=await import('./request-meta.server');await logActivityAs(data.id,data.blocked?'identifiers_blocked':'identifiers_unblocked',{identifiers:data.identifiers},context.userId);
    return {ok:true};
  });