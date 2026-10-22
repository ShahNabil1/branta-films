import { useEffect } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useAuth } from '@/lib/auth';
import { recordPresence } from '@/lib/presence.functions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function observedTouch() {
  const url = new URL(window.location.href);
  const result: Record<string,string> = { landing_page: url.pathname, captured_at: new Date().toISOString() };
  try { if (document.referrer) result['referrer'] = new URL(document.referrer).origin + new URL(document.referrer).pathname; } catch { /* no valid referrer */ }
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid','ttclid']) { const v=url.searchParams.get(key); if(v) result[key]=v.slice(0,512); }
  for (const key of ['_fbp','_fbc']) { const v=document.cookie.split('; ').find(s=>s.startsWith(`${key}=`))?.slice(key.length+1); if(v) result[key]=v.slice(0,512); }
  return result;
}
export function ViewerPresence() {
  const { user } = useAuth();
  const record = useServerFn(recordPresence);
  useEffect(() => {
    if (!user) return;
    let disposed=false, pending=false, lastInteraction=Date.now();
    let playback: string | null=null;
    let device='';
    const touch=observedTouch();
    const activity=()=>{ lastInteraction=Date.now(); };
    const play=(event: Event)=>{ const detail=(event as CustomEvent<{episode:string;playing:boolean}>).detail; playback=detail.playing?detail.episode:null; void beat(); };
    const beat=async()=>{
      if(disposed || pending || !device) return;
      pending=true;
      try { await record({data:{device,name: /Mobi|Android/i.test(navigator.userAgent)?'Mobile browser':'Desktop browser',state:playback?'watching':document.visibilityState==='hidden'||Date.now()-lastInteraction>120_000?'idle':'active',episode:playback,touch}}); }
      catch(e){ if(e instanceof Error && /restricted|blocked|no longer available/.test(e.message)){ disposed=true; toast.error(e.message); await supabase.auth.signOut(); } }
      finally{pending=false;}
    };
    const signals=[navigator.userAgent,navigator.language,screen.width,screen.height,screen.colorDepth,Intl.DateTimeFormat().resolvedOptions().timeZone,navigator.hardwareConcurrency].join('|');
    void crypto.subtle.digest('SHA-256',new TextEncoder().encode(signals)).then(hash=>{ device=Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join(''); void beat(); });
    window.addEventListener('pointerdown',activity); window.addEventListener('keydown',activity); window.addEventListener('branta-playback',play);
    document.addEventListener('visibilitychange',beat);
    const timer=window.setInterval(beat,20_000);
    return()=>{disposed=true;window.clearInterval(timer);window.removeEventListener('pointerdown',activity);window.removeEventListener('keydown',activity);window.removeEventListener('branta-playback',play);document.removeEventListener('visibilitychange',beat);};
  },[user?.id,record]);
  return null;
}