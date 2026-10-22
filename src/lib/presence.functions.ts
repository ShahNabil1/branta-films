import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireAccountAccess } from './security-middleware';
const touch = z.record(z.string().max(30), z.string().max(512)).refine(v => Object.keys(v).length <= 20);
export const recordPresence = createServerFn({ method: 'POST' }).middleware([requireAccountAccess])
  .inputValidator((input: unknown) => z.object({ device: z.string().regex(/^[a-f0-9]{64}$/), name: z.string().max(100), state: z.enum(['active','idle','watching']), episode: z.string().uuid().nullable(), touch }).parse(input))
  .handler(async ({ data, context }) => {
    const { ensureAccountAccess, trustedRequestMeta } = await import('./security.server');
    await ensureAccountAccess(context.userId, context.claims, data.device);
    const sid = z.string().uuid().parse(context.claims['session_id']);
    const { supabaseAdmin: sb } = await import('@/integrations/supabase/client.server');
    if (data.episode) {
      const { data: e, error } = await context.supabase.from('episodes').select('id,series_id,is_free').eq('id',data.episode).single();
      if (error || !e) throw new Error('Episode unavailable.');
      const [{ data: staff }, { data: unlock }] = await Promise.all([context.supabase.rpc('is_staff',{ _user_id:context.userId }),context.supabase.from('series_unlocks').select('id').eq('user_id',context.userId).eq('series_id',e.series_id).maybeSingle()]);
      if (!e.is_free && !staff && !unlock) throw new Error('Unlock this series first.');
    }
    const meta = trustedRequestMeta();
    const { error } = await sb.rpc('record_viewer_presence', { p_user: context.userId,p_session:sid,p_device:data.device,p_name:data.name,p_ip:meta.ip ?? '',p_country:meta.country ?? '',p_city:meta.city ?? '',p_agent:meta.user_agent ?? '',p_touch:data.touch,p_state:data.state,p_episode:data.episode });
    if (error) throw new Error('Could not update your session.');
    return { ok: true };
  });