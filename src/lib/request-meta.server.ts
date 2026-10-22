import { getRequest } from "@tanstack/react-start/server";

export function requestMeta() {
  const req = getRequest();
  const h = req?.headers;
  return {
    ip: h?.get("cf-connecting-ip") ?? null,
    userAgent: h?.get("user-agent")?.slice(0, 400) ?? null,
    origin: h?.get("origin") ?? (req ? new URL(req.url).origin : null),
  };
}
