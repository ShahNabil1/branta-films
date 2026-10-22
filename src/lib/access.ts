export type PlaybackDecision = "allowed" | "sign_in_required" | "locked" | "unavailable";

export type PlaybackContext = {
  signedIn: boolean;
  isStaff: boolean;
  published: boolean;
  isFree: boolean;
  unlocked: boolean;
};

/**
 * Who may receive a video link:
 * - Free episodes: any signed-in user.
 * - Paid episodes: users who unlocked the whole series or bought that episode.
 * - Staff (admin/manager) can preview everything, including unpublished.
 */
export function decidePlayback(ctx: PlaybackContext): PlaybackDecision {
  if (!ctx.signedIn) return "sign_in_required";
  if (ctx.isStaff) return "allowed";
  if (!ctx.published) return "unavailable";
  if (ctx.isFree) return "allowed";
  return ctx.unlocked ? "allowed" : "locked";
}

/** Signed video links live this long; the player refreshes them before expiry. */
export const PLAYBACK_LINK_TTL_SECONDS = 15 * 60;

/** Watch progress is saved at this interval while playing (plus on pause). */
export const PROGRESS_SAVE_INTERVAL_MS = 10_000;

/** An episode counts as finished once this fraction has been watched. */
export const COMPLETED_FRACTION = 0.95;

export function isCompleted(position: number, duration: number) {
  return duration > 0 && position / duration >= COMPLETED_FRACTION;
}
