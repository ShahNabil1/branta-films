import { describe, expect, it } from 'vitest';
import { assertTarget, hasPaidAccess, isRestricted, presenceStatus } from '@/lib/people-rules';
describe('People administration',()=>{
  const now=Date.parse('2026-10-22T01:00:00Z');
  it('counts a recent watching user as watching, not idle',()=>expect(presenceStatus([{state:'watching',last_seen_at:'2026-10-22T00:59:40Z'}],now)).toBe('watching'));
  it('counts idle independently of active',()=>expect(presenceStatus([{state:'idle',last_seen_at:'2026-10-22T00:59:40Z'}],now)).toBe('idle'));
  it('expires stale presence and excludes revoked sessions',()=>{expect(presenceStatus([{state:'active',last_seen_at:'2026-10-22T00:58:00Z'}],now)).toBe('offline');expect(presenceStatus([{state:'watching',last_seen_at:'2026-10-22T00:59:40Z',revoked_at:'2026-10-22T00:59:50Z'}],now)).toBe('offline');});
  it('marks users paid only when they have a priced series unlock',()=>{const series=[{id:'premium',price_bdt:500},{id:'free',price_bdt:0}];expect(hasPaidAccess([{series_id:'premium'}],series)).toBe(true);expect(hasPaidAccess([{series_id:'free'}],series)).toBe(false);expect(hasPaidAccess([],series)).toBe(false);});
  it('temporary bans cease at their expiry',()=>{expect(isRestricted('2026-10-22T01:00:01Z',now)).toBe(true);expect(isRestricted('2026-10-22T01:00:00Z',now)).toBe(false);});
  it('protects administrators against self restriction',()=>{expect(()=>assertTarget('owner','owner',[])).toThrow();expect(()=>assertTarget('owner','viewer',[])).not.toThrow();});
  it('protects admin accounts from credential changes and identifier blocking',()=>expect(()=>assertTarget('owner','other',['admin'])).toThrow());
});