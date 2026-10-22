import { getRequest } from '@tanstack/react-start/server';
import { isRestricted } from './people-rules';

export function trustedRequestMeta() {
  const req = getRequest();
  const cf = (req as Request & { cf?: { country?: string; city?: string } }).cf;
  // Hosting supplies these headers. Never fall back to caller-supplied x-forwarded-for.
  const ip = req.headers.get('cf-connecting-ip');
  return { ip: ip?.slice(0, 64) ?? null, country: cf?.country ?? null, city: cf?.city ?? null, user_agent: req.headers.get('user-agent')?.slice(0, 400) ?? null };
}
export async function ensureAccountAccess(userId: string, claims: Record<string, unknown>, device?: string) {
  const { supabaseAdmin: sb } = await import('@/integrations/supabase/client.server');
  const { data: account, error: accountError } = await sb.auth.admin.getUserById(userId);
  if (accountError || !account.user) throw new Error('Your session is no longer available. Please sign in again.');
  const sessionId = typeof claims['session_id'] === 'string' ? claims['session_id'] : null;
  const [restriction, session, blocks] = await Promise.all([
    sb.from('account_restrictions').select('banned_until').eq('user_id', userId).maybeSingle(),
    sessionId ? sb.from('viewer_sessions').select('revoked_at,device_hash').eq('session_id', sessionId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    sb.from('security_blocks').select('kind,value'),
  ]);
  if (restriction.error || session.error || blocks.error) throw new Error('Account security check unavailable. Please try again.');
  if (isRestricted(restriction.data?.banned_until) || session.data?.revoked_at) throw new Error('This account or session has been restricted. Contact support.');
  const observed = trustedRequestMeta();
  const email = account.user.email?.toLowerCase();
  const fingerprint = device ?? session.data?.device_hash;
  if (blocks.data?.some(b => (b.kind === 'email' && b.value === email) || (b.kind === 'ip' && b.value === observed.ip) || (b.kind === 'fingerprint' && b.value === fingerprint))) throw new Error('Access from this account or device has been blocked. Contact support.');
  return account.user;
}