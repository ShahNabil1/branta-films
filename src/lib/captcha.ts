/** Supabase enforces captcha server-side; its public settings do not expose the toggle. */
export function isCaptchaRequired(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { code?: unknown; message?: unknown };
  return value.code === "captcha_failed" || (typeof value.message === "string" && /captcha|security check failed/i.test(value.message));
}