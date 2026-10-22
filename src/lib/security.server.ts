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
  const [restriction, session] = await Promise.all([
    sb.from('account_restrictions').select('banned_until').eq('user_id', userId).maybeSingle(),
    sessionId ? sb.from('viewer_sessions').select('revoked_at,device_hash').eq('session_id', sessionId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (restriction.error || session.error) throw new Error('Account security check unavailable. Please try again.');
  if (isRestricted(account.user.banned_until) || isRestricted(restriction.data?.banned_until) || session.data?.revoked_at) throw new Error('This account or session has been restricted. Contact support.');
  const observed = trustedRequestMeta();
  const email = account.user.email?.toLowerCase();
  const fingerprint = device ?? session.data?.device_hash;
  const candidates = [{ kind: 'email', value: email }, { kind: 'ip', value: observed.ip }, { kind: 'fingerprint', value: fingerprint }];
  for (const item of candidates) {
    if (!item.value) continue;
    const { data: block, error } = await sb.from('security_blocks').select('id').eq('kind', item.kind).eq('value', item.value).maybeSingle();
    if (error) throw new Error('Account security check unavailable. Please try again.');
    if (block) throw new Error('Access from this account or device has been blocked. Contact support.');
  }
  return account.user;
}