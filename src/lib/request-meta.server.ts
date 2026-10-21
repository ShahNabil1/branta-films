import { getRequest } from "@tanstack/react-start/server";

export function requestMeta() {
  const req = getRequest();
  const h = req?.headers;
  return {
    ip: h?.get("cf-connecting-ip") ?? h?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h?.get("user-agent")?.slice(0, 400) ?? null,
    origin: h?.get("origin") ?? (req ? new URL(req.url).origin : null),
  };
}

export async function logActivityAs(userId: string, action: string, details: Record<string, unknown> = {}, actorId?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const meta = requestMeta();
  await supabaseAdmin.from("activity_log").insert({
    user_id: userId,
    actor_id: actorId ?? userId,
    action,
    details: details as never,
    ip: meta.ip,
    user_agent: meta.userAgent,
  });
}
