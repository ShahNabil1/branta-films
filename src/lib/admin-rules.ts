export function canAdminister(roles: readonly string[]) {
  return roles.includes("admin");
}

export function assertOtherAccount(actorId: string, targetId: string) {
  if (actorId === targetId) throw new Error("You cannot delete your own account or change your own role.");
}

/** Admins open the admin panel; viewers open their dashboard instead of the homepage. */
export function loginDestination(roles: readonly string[], fallback: string) {
  if (canAdminister(roles)) return "/admin";
  return !fallback || fallback === "/" ? "/account" : fallback;
}
