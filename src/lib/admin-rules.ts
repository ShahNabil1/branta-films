export function canAdminister(roles: readonly string[]) {
  return roles.includes("admin");
}

export function assertOtherAccount(actorId: string, targetId: string) {
  if (actorId === targetId) throw new Error("You cannot delete your own account or change your own role.");
}

export function loginDestination(roles: readonly string[], fallback: string) {
  return canAdminister(roles) ? "/admin" : fallback;
}