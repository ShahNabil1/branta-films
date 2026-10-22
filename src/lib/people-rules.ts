export type Presence = { state: string; last_seen_at: string; revoked_at?: string | null };
export function presenceStatus(sessions: Presence[], now = Date.now()) {
  const live = sessions.filter(s => !s.revoked_at && now - Date.parse(s.last_seen_at) < 90_000);
  return live.some(s => s.state === 'watching') ? 'watching' : live.some(s => s.state === 'active') ? 'active' : live.length ? 'idle' : 'offline';
}
export function hasPaidAccess(unlocks: { series_id: string }[], series: { id: string; price_bdt: number }[]) {
  return unlocks.some(u => series.some(s => s.id === u.series_id && s.price_bdt > 0));
}
export function isRestricted(until: string | null | undefined, now = Date.now()) {
  return Boolean(until && Date.parse(until) > now);
}
export function assertTarget(actor: string, target: string, targetRoles: string[]) {
  if (actor === target) throw new Error('You cannot restrict or change credentials for your own account here.');
  if (targetRoles.includes('admin')) throw new Error('Administrator accounts are protected from these account restrictions.');
}
export function formatWatchTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}