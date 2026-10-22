import { createMiddleware } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
export const requireAccountAccess = createMiddleware({ type: 'function' }).middleware([requireSupabaseAuth]).server(async ({ context, next }) => {
  const { ensureAccountAccess } = await import('./security.server');
  await ensureAccountAccess(context.userId, context.claims);
  return next();
});