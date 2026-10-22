/** Match a whole path segment, not /accounting or /admin/account. */
export function isAccountShieldPath(pathname: string): boolean {
  return pathname === "/account" || pathname.startsWith("/account/");
}