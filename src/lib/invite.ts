/** How long an accepted invite session may be used to set the first password. */
export const INVITE_WINDOW_SECONDS = 24 * 60 * 60;

type Amr = { method: string; timestamp: number }[];

/** Reads the `amr` list from a Supabase access token (no verification — UI routing only). */
export function amrFromAccessToken(token: string | null | undefined): Amr {
  if (!token) return [];
  try {
    const part = token.split(".")[1] ?? "";
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "="))) as {
      amr?: Amr;
    };
    return Array.isArray(json.amr) ? json.amr : [];
  } catch {
    return [];
  }
}

/** True when this session came from clicking a staff invite email, recently enough to set a password. */
export function isFreshInviteSession(amr: Amr, nowSeconds: number): boolean {
  const invite = amr.find((m) => m.method === "invite");
  return Boolean(invite && nowSeconds - invite.timestamp <= INVITE_WINDOW_SECONDS);
}
